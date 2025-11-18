-- Seed Coldwell Banker franchises
-- Note: You may need to assign owner_user_id manually after user accounts are created

INSERT INTO performance_franchises (name, slug, headcount, is_active) VALUES
  ('Meeting Point', 'meeting-point', 0, true),
  ('Infinity', 'infinity', 0, true),
  ('Peak', 'peak', 0, true),
  ('Elite', 'elite', 0, true),
  ('Legacy', 'legacy', 0, true),
  ('Empire', 'empire', 0, true),
  ('Advantage', 'advantage', 0, true),
  ('Core', 'core', 0, true),
  ('Gate', 'gate', 0, true),
  ('Rangers', 'rangers', 0, true),
  ('Ninety', 'ninety', 0, true),
  ('TM', 'tm', 0, true),
  ('Winners', 'winners', 0, true),
  ('Trust', 'trust', 0, true),
  ('Stellar', 'stellar', 0, true),
  ('Skyward', 'skyward', 0, true),
  ('Hills', 'hills', 0, true),
  ('Wealth', 'wealth', 0, true),
  ('New Alex', 'new-alex', 0, true),
  ('Platinum', 'platinum', 0, true),
  ('Hub', 'hub', 0, true),
  ('Experts', 'experts', 0, true)
ON CONFLICT (slug) DO NOTHING;

