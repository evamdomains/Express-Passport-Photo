-- Reliable customer-delivery email: per-order status + retry bookkeeping.
--
-- Design notes
-- ------------
-- * email_status drives an idempotent, retryable send. New rows default to
--   PENDING; the sender atomically claims PENDING/FAILED → SENDING, then sets
--   SENT (success) or FAILED (with the error + an incremented retry count).
-- * A cron worker (/api/cron/email-retry) retries FAILED rows every 5 minutes
--   until email_retry_count hits 5, then alerts the admin.
-- * Exactly-once: only PENDING/FAILED rows under the retry cap can transition to
--   SENDING, so duplicate webhook deliveries / overlapping retries never double-send.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS email_status          TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS email_retry_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_email_attempt_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_sent_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_email_error       TEXT;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_email_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_email_status_check
  CHECK (email_status IN ('PENDING', 'SENDING', 'SENT', 'FAILED'));

-- Fast lookup for the retry worker (FAILED rows under the cap, oldest first) and
-- stale-SENDING reclaim.
CREATE INDEX IF NOT EXISTS idx_orders_email_retry
  ON orders (email_status, email_retry_count, last_email_attempt_at)
  WHERE email_status IN ('FAILED', 'SENDING');
