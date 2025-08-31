-- Add team management features only (without deals table conflicts)
-- 1. Ensure profiles.manager_id exists
alter table if exists public.profiles
  add column if not exists manager_id uuid references public.profiles(id);

-- 2. Add lead assignment to existing leads table
alter table if exists public.leads
  add column if not exists assigned_to_id uuid references public.profiles(id);

-- Optional convenience indexes
create index if not exists idx_leads_assigned_to on public.leads(assigned_to_id);
create index if not exists idx_leads_buyer on public.leads(buyer_user_id);
create index if not exists idx_profiles_manager on public.profiles(manager_id);

-- 3. Create recursive helper to resolve a manager's full tree
drop function if exists public.rpc_team_user_ids(uuid);
create or replace function public.rpc_team_user_ids(root uuid)
returns table(user_id uuid)
language sql
security definer
stable
set search_path = public
as $$
  with recursive tree as (
    select p.id
    from public.profiles p
    where p.id = root
    union all
    select c.id
    from public.profiles c
    join tree t on c.manager_id = t.id
  )
  select id as user_id from tree;
$$;

-- 4. RLS policies for profiles (only if not exists)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_read_access') then
    create policy profiles_read_access
    on public.profiles for select
    using (
      auth.uid() = id
      or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role in ('admin','support'))
      or id in (select user_id from public.rpc_team_user_ids(auth.uid()))
    );
  end if;
  
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_update_self') then
    create policy profiles_update_self
    on public.profiles for update
    using (auth.uid() = id);
  end if;
end $$;

-- 5. RLS policies for leads (only if not exists)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'leads' and policyname = 'leads_select_policy') then
    create policy leads_select_policy
    on public.leads for select
    using (
      buyer_user_id = auth.uid()
      or assigned_to_id = auth.uid()
      or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role in ('admin','support'))
      or buyer_user_id in (select user_id from public.rpc_team_user_ids(auth.uid()))
    );
  end if;
  
  if not exists (select 1 from pg_policies where tablename = 'leads' and policyname = 'leads_update_policy') then
    create policy leads_update_policy
    on public.leads for update
    using (
      buyer_user_id = auth.uid()
      or assigned_to_id = auth.uid()
      or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role in ('admin','support'))
      or buyer_user_id in (select user_id from public.rpc_team_user_ids(auth.uid()))
    );
  end if;
end $$;

-- 6. Secure RPCs for team management & assigning leads

-- Add or attach a user to my team (by id) – manager/admin/support only
drop function if exists public.rpc_add_user_to_team(uuid);
create or replace function public.rpc_add_user_to_team(target_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  me_role text;
begin
  select role into me_role from public.profiles where id = auth.uid();
  if me_role not in ('manager','admin','support') then
    raise exception 'not_authorized';
  end if;

  update public.profiles set manager_id = auth.uid()
  where id = target_user_id;

  return true;
end; $$;

-- Assign a lead to a user in my team (or myself). Validates ownership.
drop function if exists public.rpc_assign_lead(uuid, uuid);
create or replace function public.rpc_assign_lead(lead_id uuid, assignee_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  me uuid := auth.uid();
  me_role text;
  owner_id uuid;
  valid_assignee boolean;
begin
  select role into me_role from public.profiles where id = me;

  -- Lead must be owned by me or someone in my tree (or I'm admin/support)
  select buyer_user_id into owner_id from public.leads where id = lead_id;

  if owner_id is null then
    raise exception 'lead_not_found';
  end if;

  if me_role not in ('admin','support')
     and owner_id not in (select user_id from public.rpc_team_user_ids(me)) 
     and owner_id <> me then
    raise exception 'not_authorized_to_assign';
  end if;

  -- Assignee must be me or in my tree (or admin/support)
  if me_role in ('admin','support') then
    valid_assignee := true;
  else
    valid_assignee := assignee_id = me or assignee_id in (select user_id from public.rpc_team_user_ids(me));
  end if;

  if not valid_assignee then
    raise exception 'invalid_assignee';
  end if;

  update public.leads set assigned_to_id = assignee_id, updated_at = now()
  where id = lead_id;

  return true;
end; $$;

-- Optional: unassign
drop function if exists public.rpc_unassign_lead(uuid);
create or replace function public.rpc_unassign_lead(lead_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  me uuid := auth.uid();
  me_role text;
  owner_id uuid;
begin
  select role into me_role from public.profiles where id = me;
  select buyer_user_id into owner_id from public.leads where id = lead_id;

  if owner_id is null then raise exception 'lead_not_found'; end if;

  if me_role not in ('admin','support')
     and owner_id not in (select user_id from public.rpc_team_user_ids(me))
     and owner_id <> me then
    raise exception 'not_authorized';
  end if;

  update public.leads set assigned_to_id = null, updated_at = now()
  where id = lead_id;
  return true;
end; $$;
