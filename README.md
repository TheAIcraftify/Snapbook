# SnapBook

**Book a Creator. Capture the Moment.**

SnapBook is an on-demand creator booking marketplace for India — think Uber, but instead of
drivers, customers discover and book photographers, videographers, and reel/content creators
nearby.

> **Status: Phase 1 of 10** — project architecture, design system, database schema, and the
> first customer screens (Home, Login, Sign Up) are implemented. See [Roadmap](#roadmap).

---

## Features (target scope)

- **Customers**: search creators by category/date/price/rating, view portfolios, book services,
  chat, pay, track live booking status, leave reviews.
- **Creators**: onboarding & verification, portfolio management, pricing & availability,
  accept/reject bookings, earnings & payouts, chat.
- **Admin**: manage users, verify creators, configure commission, moderate reviews/complaints,
  manage featured listings & ads, view platform analytics.

Full feature list lives in the original product spec; screen-by-screen status is tracked in the
[Roadmap](#roadmap) below.

## Tech stack

| Layer          | Choice                                      |
| -------------- | -------------------------------------------- |
| Frontend       | Next.js 14 (App Router) + TypeScript          |
| UI             | Tailwind CSS + custom component system       |
| Backend        | Next.js Route Handlers / Server Actions      |
| Database       | PostgreSQL via Supabase                       |
| Auth           | Supabase Auth                                 |
| Storage        | Supabase Storage                              |
| Realtime       | Supabase Realtime                             |
| Maps/location  | Google Maps (service module, mockable)       |
| Payments       | Razorpay (service module, mockable)          |
| Notifications  | Firebase Cloud Messaging (service module, mockable) |
| Deployment     | Vercel                                        |

## Demo mode — runs with zero API keys

Every external integration (Supabase, Razorpay, Google Maps, Firebase) is wrapped in a thin
service module under `src/lib/<service>/`. Each module checks whether real credentials are
present (`src/lib/env.ts`) and falls back to deterministic mock data or a safe no-op when they
aren't. This means:

```bash
git clone <your-repo-url>
cd snapbook
npm install
npm run dev
```

...boots a fully clickable app with sample creators, mock geocoding, and simulated
login/signup — no `.env.local` required. This is intentional so the product can be reviewed and
developed against before production credentials exist.

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **(Optional) Connect real services** — copy the env template and fill in only the services
   you're ready to use. You can mix and match (e.g. real Supabase + mock Razorpay).
   ```bash
   cp .env.example .env.local
   ```
3. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Environment variables

See [`.env.example`](./.env.example) for the full list with descriptions. Summary:

| Variable | Required for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Real auth/database/storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations (bypasses RLS — never expose client-side) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Real payments |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Real geocoding/maps rendering |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Real push notifications |

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Grab the Project URL and anon key from **Project Settings → API** and put them in
   `.env.local`.
3. Run the migration against your project:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   (or paste the contents of `supabase/migrations/0001_init_schema.sql` into the Supabase SQL
   editor.)
4. Regenerate types once your schema is live (optional — a hand-written equivalent already
   exists at `src/lib/types/database.ts`):
   ```bash
   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts
   ```

## Database setup

The schema lives in [`supabase/migrations/0001_init_schema.sql`](./supabase/migrations/0001_init_schema.sql) and covers all 21 tables from the
product spec (users, profiles, categories, services, portfolio, availability, bookings,
payments, refunds, chat, reviews, notifications, payouts, commissions, memberships, featured
listings, ads, complaints, admin users), with:

- UUID primary keys, foreign keys with appropriate `on delete` behavior
- Enums for role/status fields (booking status, verification status, payment status, etc.)
- Indexes on foreign keys and common filter columns
- `created_at`/`updated_at` timestamps with an auto-touch trigger
- Row Level Security enabled (policies land in Phase 2 alongside auth)
- Seed data for creator categories and the default 18% commission

## Running the project

```bash
npm run dev        # start dev server
npm run build       # production build
npm run start        # run production build locally
npm run lint          # ESLint
npm run typecheck      # tsc --noEmit
```

## Deployment

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Add the environment variables from `.env.example` you intend to use in the Vercel project
   settings (any left unset simply keeps that service in demo mode in production too).
4. Deploy. Vercel auto-detects Next.js — no custom build config needed.

## Architecture notes

- **Route groups** (`src/app/(customer)`, `(creator)`, `(admin)`) separate the three user
  experiences without affecting URL structure.
- **Service modules** (`src/lib/supabase`, `razorpay`, `maps`, `fcm`) are the *only* places that
  talk to external APIs — components and route handlers never call third-party SDKs directly.
  This keeps the mock/live switch centralized and makes future provider swaps low-risk.
- **`src/config/constants.ts`** is the single source of truth for enums (booking statuses,
  creator categories, commission default) shared between the database schema, types, and UI.
- **`middleware.ts`** enforces role-based route protection for `/admin/*` and
  `/creator/dashboard/*`; it's a no-op until Supabase credentials are configured.

## Roadmap

- [x] **Phase 1** — Project architecture, design system, DB schema, Home/Login/Sign Up
- [ ] **Phase 2** — Authentication & role-based access (real Supabase Auth wiring, RLS policies)
- [ ] **Phase 3** — Creator profiles & portfolio management
- [ ] **Phase 4** — Search & filtering (category, date, price, rating, location)
- [ ] **Phase 5** — Availability calendar & booking flow
- [ ] **Phase 6** — In-app chat & notifications (Supabase Realtime + FCM)
- [ ] **Phase 7** — Payment architecture (Razorpay live integration)
- [ ] **Phase 8** — Reviews & ratings
- [ ] **Phase 9** — Admin dashboard
- [ ] **Phase 10** — Testing, security hardening, deployment prep

---

Built as an MVP intended to evolve into a production application — no shortcuts on schema
design or type safety, even while UI is being fleshed out phase by phase.
