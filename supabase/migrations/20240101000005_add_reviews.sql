-- Customer reviews / ratings.
--
-- Design notes
-- ------------
-- * Public submissions land as 'pending' and are NOT shown until a moderator
--   sets status = 'approved' (spam/abuse guard). Rejected reviews are kept for
--   audit but never displayed.
-- * Like `orders`, writes go through the service-role key (bypasses RLS), so no
--   INSERT/UPDATE policy is defined. The only RLS SELECT policy exposes approved
--   rows, so even the anon key can never read pending/rejected content.
-- * The public list API (service role) filters status = 'approved' explicitly.

CREATE TABLE IF NOT EXISTS reviews (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  location      TEXT,
  document_type TEXT,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone may read APPROVED reviews only. Pending/rejected stay private.
-- (Server API routes use the service role and additionally filter by status.)
DROP POLICY IF EXISTS "Read approved reviews" ON reviews;
CREATE POLICY "Read approved reviews" ON reviews
  FOR SELECT USING (status = 'approved');

-- INSERT/UPDATE policies intentionally absent — service role handles all writes.

-- Fast moderation queue + public listing.
CREATE INDEX IF NOT EXISTS idx_reviews_status_created
  ON reviews (status, created_at DESC);
