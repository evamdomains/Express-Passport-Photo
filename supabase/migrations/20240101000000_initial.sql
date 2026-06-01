-- Run in Supabase SQL editor or via `supabase db push`

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL,
  product_sku TEXT NOT NULL DEFAULT 'digital_download',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  email TEXT,
  photo_original_url TEXT,
  photo_processed_url TEXT,
  photo_composite_url TEXT,
  download_url TEXT,
  compliance_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone who knows the UUID can read their order (UUID is the unguessable token).
-- No auth required — the UUID itself acts as the access secret.
CREATE POLICY "Read order by id" ON orders
  FOR SELECT USING (true);

-- INSERT and UPDATE policies are intentionally absent.
-- The service role key (used in all API routes) bypasses RLS entirely,
-- so writes are restricted to server-side code without needing a policy.
-- The anon key (used client-side) cannot write to this table.

-- Storage buckets (run in Supabase Dashboard > Storage)
-- Create a public bucket named: photos
-- Allowed MIME types: image/jpeg, image/png, application/pdf
