# 🎰 VegasCrew — Trip Planner

A real-time collaborative trip planning site for your Vegas crew. Built with React + Vite + Supabase, deployable to Vercel in ~5 minutes.

## Features
- **Hero** — Countdown timer, trip title, quick nav links
- **Who's In** — RSVP tracker (In / Maybe / Out) with +1 support, live updates
- **Polls** — Hotel vote + Weekend vote with live bar charts
- **Activities** — Filterable list of things to do
- **Budget Estimator** — Per-person and group total calculator
- **Group Chat** — Real-time comment thread

## Quick Setup

### 1. Supabase
1. Create a free project at supabase.com
2. SQL Editor → run everything in `supabase-schema.sql`
3. Settings → API → copy Project URL and anon key

### 2. Local dev
```
cp .env.example .env.local
# fill in your Supabase values
npm install && npm run dev
```

### 3. Deploy to Vercel
1. Push to GitHub
2. Import at vercel.com/new
3. Add env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
4. Deploy — done. Share the URL.

## Customizing
- **Trip date**: find `new Date('2026-02-14')` in App.jsx
- **Hotels/weekends**: update `HOTELS` and `WEEKENDS` arrays in App.jsx
- **Activities**: update `ACTIVITIES` array in App.jsx
