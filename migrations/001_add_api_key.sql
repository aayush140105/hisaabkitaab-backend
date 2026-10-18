-- Run this once against the live Supabase DB (it's additive/safe, no data loss).
-- Adds per-device API keys so backend endpoints can verify ownership (fixes PENTEST_REPORT.md C1).
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
