# Idea Lab Deployment

## 1. Create the Supabase project (optional)

Analytics is entirely optional — the app runs fully offline without it.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**.
3. Run `supabase/schema.sql`.
4. Copy the project URL and the public anon key from **Project Settings > API**.

The table only accepts anonymous event inserts from the browser client. No
`select` policy exists, so the anon key cannot read any data back out.

## 2. Configure the local environment

Copy `.env.example` to `.env.local` and fill in both values:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Both variable names must match exactly — the client reads
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `src/lib/analytics.js`.
If either is missing, analytics stays disabled and the rest of the app is
unaffected.

Never commit `.env.local`; it is covered by `.gitignore`.

## 3. Run locally

```bash
npm install
npm run dev
```

## 4. Build and preview the production bundle

```bash
npm run build
npm run preview
```

## 5. Deploy to Vercel

`vercel.json` already sets the framework, build command, output directory, and
the SPA rewrite.

1. Import the repository in Vercel.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under
   **Settings > Environment Variables** (only if you want analytics).
3. Deploy.

Because Vite inlines `VITE_*` variables at build time, changing them requires a
redeploy to take effect.

## Privacy notes

- No analytics event is sent until the user explicitly accepts the consent banner.
- Only coarse metadata is transmitted: idea type, domains, format, difficulty,
  and rating. Prompts, constraints, audience text, and API keys are never sent.
- "Privacy controls" in the footer resets the local learning profile, clears the
  anonymous ID, and re-prompts for consent.
