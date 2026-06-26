-- Human-review path: lets a customer choose expert manual review instead of
-- (or in addition to) the instant AI compliance check.
--
-- Design notes
-- ------------
-- * `review_type` distinguishes the two product paths. Existing rows default to
--   'ai' so nothing about the current automated flow changes.
-- * `review_status` only applies when review_type = 'human'. It tracks the
--   manual-review lifecycle independently of the existing `status` column
--   (which stays the Stripe/fulfilment state machine).
-- * Payment happens FIRST (Stripe), then the order lands in 'awaiting_review'.
--   A reviewer sets it to 'approved' (which triggers the same /api/process-photo
--   pipeline → processed photo + 4x6 print files) or 'rejected' (customer is
--   asked to re-upload via HubSpot chat).
-- * Customer contact fields back the HubSpot live-chat identify() call.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS review_type TEXT NOT NULL DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS review_status TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Guard rails on the allowed values (cheap CHECKs; NULL allowed for review_status
-- because AI orders never set it).
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_review_type_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_review_type_check
  CHECK (review_type IN ('ai', 'human'));

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_review_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_review_status_check
  CHECK (review_status IS NULL OR review_status IN
    ('awaiting_review', 'in_review', 'approved', 'rejected'));

-- Fast lookups for the admin review queue.
CREATE INDEX IF NOT EXISTS idx_orders_review_queue
  ON orders (review_type, review_status, created_at DESC)
  WHERE review_type = 'human';
