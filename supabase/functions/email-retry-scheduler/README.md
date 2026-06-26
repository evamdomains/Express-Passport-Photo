# Email retry scheduler — Supabase migration

Migrates **who triggers** the delivery-email retry worker from **Vercel Cron** to
the **Supabase Scheduler**. Nothing about the retry logic changes.

```
Before:  Vercel Cron        → /api/cron/email-retry → deliverDigitalEmail()
After:   Supabase Scheduler → email-retry-scheduler (Edge Function) → POST /api/cron/email-retry → deliverDigitalEmail()
```

The retry workflow (`email_status` PENDING→SENDING→SENT/FAILED, `email_retry_count`,
admin alert after the cap, atomic exactly-once claim) is **unchanged** and remains
the single source of truth in `src/lib/email-delivery.ts` + `src/app/api/cron/email-retry`.

---

## A. What changed
- **Removed** the `email-retry` entry from `vercel.json` (the `cleanup` cron stays).
- **Added** a Supabase Edge Function (`email-retry-scheduler`) that does nothing but
  POST to the existing retry endpoint with the `CRON_SECRET` bearer token.
- The retry endpoint now also accepts **POST** (it already accepted GET); both run the
  identical handler.
- Scheduling moves to **pg_cron** inside Supabase (5-minute interval).

## B. Files created
- `supabase/functions/email-retry-scheduler/index.ts` — the scheduler bridge.
- `supabase/functions/email-retry-scheduler/README.md` — this doc.

## C. Files modified
- `vercel.json` — removed the email-retry cron registration.
- `src/app/api/cron/email-retry/route.ts` — exported `POST` (and `GET`) → shared handler. **No logic change.**
- `tsconfig.json` — excluded `supabase/functions` from the app's type-check (Deno code).

## D. Deployment steps
```bash
# 1. Scaffold (only if the folder didn't already exist)
supabase functions new email-retry-scheduler

# 2. Deploy the Edge Function.
#    --no-verify-jwt: the function is invoked by pg_cron, not an end user, and it
#    authenticates downstream with CRON_SECRET. Omit if you prefer JWT-gated invokes.
supabase functions deploy email-retry-scheduler --no-verify-jwt

# 3. Set the Edge Function secrets
supabase secrets set WEBSITE_URL=https://expresspassportphoto.com
supabase secrets set CRON_SECRET=<the same CRON_SECRET the Next.js app uses>
```

## E. Supabase dashboard configuration
1. **Database → Extensions** → enable **`pg_cron`** and **`pg_net`**.
2. **Edge Functions** → confirm `email-retry-scheduler` is deployed; note its URL:
   `https://<PROJECT_REF>.supabase.co/functions/v1/email-retry-scheduler`.
3. **Edge Functions → Secrets** → confirm `WEBSITE_URL` and `CRON_SECRET` are set.
4. Run the SQL in section **F** (SQL Editor) to register the 5-minute schedule.

## F. SQL required (run once, in the Supabase SQL Editor — NOT executed for you)
Replace `<PROJECT_REF>` and `<SUPABASE_SERVICE_ROLE_KEY>` before running.
```sql
-- Enable the scheduler + HTTP client (no-ops if already enabled).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Invoke the Edge Function every 5 minutes. The Edge Function then POSTs to
-- /api/cron/email-retry with the CRON_SECRET bearer token.
select cron.schedule(
  'email-retry-scheduler',          -- job name (unique)
  '*/5 * * * *',                    -- every 5 minutes
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/email-retry-scheduler',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);
```

## G. How to test locally
```bash
# Run the endpoint directly (the retry worker), bypassing the scheduler:
curl -i -X POST http://localhost:3000/api/cron/email-retry \
  -H "Authorization: Bearer $CRON_SECRET"
# Expect 200 {"retried":N,"sent":..,"stillFailing":..}; 401 without the header.

# Run the Edge Function locally (set the two secrets in the shell first):
supabase functions serve email-retry-scheduler --env-file ./supabase/.env.local
# then: curl -i -X POST http://localhost:54321/functions/v1/email-retry-scheduler
```

## H. How to test production
```bash
# Invoke the deployed Edge Function manually (forces one retry pass now):
curl -i -X POST https://<PROJECT_REF>.supabase.co/functions/v1/email-retry-scheduler \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"

# Confirm it reached the app + ran the worker:
#  • Supabase → Edge Functions → email-retry-scheduler → Logs  (POST … → 200)
#  • App logs show [email-retry] done — retried N, sent X
# Verify the schedule is registered:
select * from cron.job where jobname = 'email-retry-scheduler';
# Inspect recent runs:
select * from cron.job_run_details order by start_time desc limit 10;
```

## I. How to disable / roll back the scheduler later
```sql
-- Stop the Supabase schedule:
select cron.unschedule('email-retry-scheduler');
```
```bash
# (optional) remove the Edge Function entirely:
supabase functions delete email-retry-scheduler
```
**Roll back to Vercel Cron** by re-adding to `vercel.json` and redeploying:
```json
{ "path": "/api/cron/email-retry", "schedule": "*/5 * * * *" }
```
The retry endpoint and `deliverDigitalEmail()` are untouched, so either scheduler
(or both, or neither) works without code changes.
