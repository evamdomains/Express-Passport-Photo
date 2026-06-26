// Supabase Edge Function — `email-retry-scheduler`
//
// SCHEDULER BRIDGE ONLY. This function contains NO retry logic. It is invoked by
// the Supabase Scheduler (pg_cron, every 5 minutes) and simply makes one
// authenticated POST to the Next.js retry endpoint, which runs the real,
// unchanged worker:
//
//   Supabase Scheduler → email-retry-scheduler (this) → POST /api/cron/email-retry → deliverDigitalEmail()
//
// Secrets (set with `supabase secrets set`):
//   WEBSITE_URL  — base URL of the deployed site, e.g. https://expresspassportphoto.com
//   CRON_SECRET  — same secret the endpoint checks (Authorization: Bearer <CRON_SECRET>)
//
// Runs on Deno (Supabase Edge runtime), not in the Next.js app — it is excluded
// from the app's tsconfig.

Deno.serve(async () => {
  const websiteUrl = Deno.env.get("WEBSITE_URL");
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (!websiteUrl || !cronSecret) {
    console.error("[email-retry-scheduler] missing WEBSITE_URL or CRON_SECRET secret");
    return new Response(
      JSON.stringify({ ok: false, error: "Missing WEBSITE_URL or CRON_SECRET" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const target = `${websiteUrl.replace(/\/+$/, "")}/api/cron/email-retry`;

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "content-type": "application/json",
      },
    });

    const body = await res.text();
    console.log(`[email-retry-scheduler] POST ${target} → ${res.status}`);

    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status, body }),
      { status: res.ok ? 200 : 502, headers: { "content-type": "application/json" } },
    );
  } catch (err) {
    console.error("[email-retry-scheduler] request failed", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
});
