-- Adds the 'reupload_approved' state to the human-review lifecycle.
--
-- Flow recap (Approach 2, email handoff):
--   awaiting_review → approved            (expert clicks Accept; files generated)
--   awaiting_review → rejected            (expert clicks Reject; reasons sent by email)
--   rejected        → reupload_approved   (expert clicks "Re-uploaded photo accepted"
--                                           AFTER the customer emails a corrected photo)
--   reupload_approved → approved          (customer uploads the approved photo on the
--                                           status page; the normal pipeline generates
--                                           the downloadable files + emails them)
--
-- 'reupload_approved' is the only customer-facing state that re-opens an upload
-- box. The site trusts that the uploaded file is the one the expert approved
-- over email (option 1 — trust-based); schema leaves room to tighten later.

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_review_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_review_status_check
  CHECK (review_status IS NULL OR review_status IN
    ('awaiting_review', 'in_review', 'approved', 'rejected', 'reupload_approved'));
