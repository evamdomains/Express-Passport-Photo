-- Backfill pdf_url for digital orders that were fulfilled BEFORE the pdf_url
-- column existed (migration 20240101000001 had not been applied, so the
-- webhook's `update({ pdf_url })` silently failed).
--
-- The webhook only sets `download_url` once the print.pdf has been uploaded to
-- storage (pdfReady), so a non-null download_url is a reliable signal that the
-- file exists at the deterministic path orders/<id>/print.pdf. Idempotent.
UPDATE orders
SET pdf_url = 'orders/' || id || '/print.pdf'
WHERE product_sku = 'digital_download'
  AND status = 'fulfilled'
  AND pdf_url IS NULL
  AND download_url IS NOT NULL;
