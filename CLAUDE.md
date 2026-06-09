# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server on :3000
npm run build        # production build
npm run type-check   # TypeScript check without emitting
npm run lint         # ESLint
```

## Architecture

### User flow
`/` → `/upload?type=<docType>` → `/editor?orderId=<id>` → `/checkout?orderId=<id>` → Stripe → `/order-confirmation?orderId=<id>`

State flows through the `orders` table in Supabase, keyed by UUID `orderId` passed as a URL param at each step.

### Photo processing pipeline (`/api/process-photo`)
1. **PhotoRoom** (`src/lib/photoroom.ts`) — REST call to `sdk.photoroom.com/v1/segment`, returns transparent PNG
2. **Sharp** (`src/lib/sharp-utils.ts`) — composites PNG onto white, resizes to document spec, builds tiled 4×6 JPEG
3. **Rekognition** (`src/lib/rekognition.ts`) — `DetectFaces` with `ALL` attributes; checks face size %, eyes open, mouth closed, head angle
4. Both the processed photo and the 4×6 composite are uploaded to Supabase Storage (`photos` bucket)

PDF generation (`createPrintPdf`) uses `pdf-lib` (no native deps) to wrap the tiled JPEG in a 4×6 inch PDF. This runs in the Stripe webhook handler after payment, not at upload time.

### Document specs (`src/constants/document-specs.ts`)
All dimensions, compliance thresholds, and tile counts live here. US docs are 600×600px (2×2 in); Canadian docs are 591×827px (50×70mm). `tilesOn4x6` controls how many photos are placed on the 4×6 print layout.

### Payments
- Two Stripe products: `STRIPE_PRICE_DIGITAL` ($4.99) and `STRIPE_PRICE_PRINTED` ($8.99)
- Checkout session includes `orderId` in `metadata`
- Webhook (`/api/webhooks/stripe`) handles `checkout.session.completed`: generates PDF + emails download link for digital; sends confirmation email for printed
- Webhook secret must be set (`STRIPE_WEBHOOK_SECRET`); test locally with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Database
Single `orders` table (see `supabase/migrations/`). No auth — orders are looked up by UUID. Service role key is used in all API routes; the anon key is only used client-side.

### Store locator
`/api/stores?zip=XXXXX` geocodes the zip, then calls Google Places Nearby Search for "CVS pharmacy" and "Walgreens pharmacy" in parallel within 10 miles.

## Environment setup
Copy `.env.local` and fill in all keys. Stripe price IDs must be created manually in the Stripe Dashboard and pasted in. Supabase storage bucket `photos` must be created as **public**.
