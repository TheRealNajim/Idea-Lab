# Idea Lab Deployment

Idea Lab v2 has three layers, each optional — the app degrades gracefully
when a layer is not configured:

| Layer | What it powers | Requires |
| --- | --- | --- |
| Local | Idea generation, vault, learning profile | nothing |
| Signals + accounts | Signal scan, free trial, Pro billing | Supabase + Vercel |
| AI architect | Server-model blueprints | one provider key |

Everything in `src/` runs client-side; `/api` are Vercel serverless functions
that hold the secrets and enforce trial credits.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run `supabase/schema.sql`. It is idempotent — safe
   to re-run on upgrades. It creates:
   - `usage_events` (anonymous analytics, insert-only for the anon role)
   - `profiles` (plan + trial credits + Stripe linkage, readable by the owner,
     mutated only by the service role)
   - `consume_trial_credit` / `refund_trial_credit` RPCs (atomic credit
     accounting, executable only by the service role)
   - a trigger that creates a trial profile for every new auth user
3. Copy the project URL and anon key from **Project Settings > API** into
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Copy the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY` (server env
   only — treat it like a password).
5. Auth: under **Authentication > URL Configuration**, add your production
   domain (and `http://localhost:5173` for local dev) to **Redirect URLs**.
   Sign-in is magic-link email, so no OAuth apps or custom SMTP are needed
   (the built-in email sender works; raise its rate limits in production if
   you expect volume).

**Trial policy:** every new account starts on the `trial` plan with
5 signal scans + 3 AI blueprints. When a scan or blueprint is authorized, the
API atomically decrements the matching column. When credits run out, the
client opens the paywall. To change the amounts, edit the defaults in
`supabase/schema.sql` **before** first run (existing rows keep their counts).

## 2. Signal sources (optional keys)

The scan always works with the free, keyless sources: Reddit (public JSON),
Hacker News (Algolia), Stack Overflow, and Medium (tag RSS).

| Source | Env vars | Notes |
| --- | --- | --- |
| Reddit | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | Optional. OAuth app (script type) at reddit.com/prefs/apps raises rate limits. |
| Stack Overflow | `STACKEXCHANGE_KEY` | Optional. Higher quota at stackapps.com. |
| YouTube | `YOUTUBE_API_KEY` | Google Cloud console; Data API v3 free tier. |
| X / Twitter | `TWITTER_BEARER_TOKEN` | Requires a paid API tier with recent-search access. |
| Facebook / Instagram | — | Not supported. Meta's Graph API has no public content search without a reviewed partner app; the UI lists them as locked. |

## 3. Server AI (blueprints)

Pick one provider and set `AI_PROVIDER` (`OpenAI` | `Anthropic` | `Gemini`)
plus the matching key (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` /
`GEMINI_API_KEY`). `AI_MODEL` overrides the default model
(`gpt-4o-mini` / `claude-sonnet-4-20250514` / `gemini-2.0-flash`).

Users can always skip metering by pasting their own key in **Model setup** —
those calls go straight from the browser to the provider and never touch the
server (keys live in sessionStorage and die with the tab).

## 4. Stripe (Pro subscriptions)

1. Create a recurring **Product** (e.g. "Idea Lab Pro") and copy its price ID
   into `STRIPE_PRICE_ID`.
2. Set `STRIPE_SECRET_KEY` (test or live).
3. Add a **Webhook endpoint** in Stripe pointing at
   `https://your-app.vercel.app/api/stripe/webhook` with events:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`.
4. Set `APP_URL` if the function runs behind a proxy (otherwise it derives
   the origin from Vercel's forwarded headers).

Flow: `Upgrade to Pro` → `/api/stripe/checkout` creates a Checkout Session
linked to the user's profile → Stripe redirects back with
`?checkout=success` → the client polls the profile while the webhook flips
`plan` to `pro` → unlimited scans/blueprints. Cancelling (via the billing
portal) downgrades to `free` when the subscription ends.

## 5. Run locally

```bash
npm install
npm run dev          # frontend only — /api routes unavailable
```

The signal scan, blueprints-on-credits, and checkout need the serverless
functions, so use the Vercel CLI with your env vars linked:

```bash
npm i -g vercel
vercel link
vercel env pull .env.local   # pulls the project's server env too
npx vercel dev               # serves the SPA and /api together
```

Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env.local` for
auth + analytics. Never commit `.env.local`; it is covered by `.gitignore`.

## 6. Deploy to Vercel

`vercel.json` sets the framework, build command, output directory, and an SPA
rewrite that excludes `/api/*` so the serverless functions are not shadowed.

1. Import the repository in Vercel.
2. Add env vars: the `VITE_*` pair (build time) and all server vars
   (`SUPABASE_SERVICE_ROLE_KEY`, provider keys, Stripe) — mark the server
   ones as excluded from the browser? Not needed: only `VITE_`-prefixed
   variables are inlined into the client bundle; the rest stay server-side.
3. Deploy, then configure the Stripe webhook against the production URL.

## 7. Deploy to GitHub Pages (static mirror)

The Pages workflow publishes `dist/` with no functions. The app detects the
missing backend and the UI explains it. To give the mirror the full feature
set, point it at your Vercel deployment by setting `VITE_API_BASE` in the
workflow environment (Settings > Secrets and variables > Actions) to your
Vercel URL — the API routes send permissive CORS headers for exactly this
case.

## Privacy notes

- No analytics event is sent until the user explicitly accepts the consent
  banner, and only coarse metadata is transmitted (type, domains, counts).
- Provider keys entered in **Model setup** are stored in sessionStorage and
  used only for browser-direct blueprint calls — they are never sent to the
  Idea Lab server.
- Trial credits and plan changes are written exclusively by the service role
  inside the `/api` functions and the Stripe webhook; the client can only
  read its own profile row.
- "Privacy controls" in the footer resets the local learning profile, clears
  the anonymous ID, and re-prompts for consent.
