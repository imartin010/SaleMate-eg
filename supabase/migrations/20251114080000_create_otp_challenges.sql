begin;

-- Drop legacy OTP artefacts
drop table if exists public.otp_verifications cascade;
drop function if exists public.cleanup_expired_otps() cascade;

-- Utility function to maintain updated_at timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- New OTP challenge table
create table if not exists public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  context text not null,
  channel text not null default 'sms',
  target text not null,
  phone text,
  code_hash text not null,
  provider text not null default 'twilio_sms',
  status text not null default 'pending',
  attempt_count integer not null default 0,
  send_count integer not null default 0,
  metadata jsonb not null default '{}',
  expires_at timestamptz not null,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_otp_challenges_target_created_at
  on public.otp_challenges(target, created_at desc);

create index if not exists idx_otp_challenges_status_expires
  on public.otp_challenges(status, expires_at);

create index if not exists idx_otp_challenges_context
  on public.otp_challenges(context);

create trigger trg_otp_challenges_updated_at
  before update on public.otp_challenges
  for each row
  execute function public.set_updated_at();

-- Attempts log
create table if not exists public.otp_attempts (
  id bigserial primary key,
  challenge_id uuid not null references public.otp_challenges(id) on delete cascade,
  result text not null,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_otp_attempts_challenge_id
  on public.otp_attempts(challenge_id);

-- RLS configuration
alter table public.otp_challenges enable row level security;
alter table public.otp_attempts enable row level security;

create policy "Service role manage otp challenges"
  on public.otp_challenges
  for all
  to service_role
  using (true)
  with check (true);

create policy "Service role manage otp attempts"
  on public.otp_attempts
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on public.otp_challenges to service_role;
grant select, insert, delete on public.otp_attempts to service_role;

-- Cleanup function
create or replace function public.purge_expired_otps()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.otp_attempts
  where created_at < now() - interval '7 days';

  delete from public.otp_challenges
  where expires_at < now() - interval '24 hours'
    and status in ('expired', 'failed', 'verified', 'cancelled');
end;
$$;

grant execute on function public.purge_expired_otps() to service_role;

commit;

