# ScoutX

ScoutX is a sports discovery and recruitment platform focused on Indian football. It gives athletes a verified digital profile with career history, highlight media, fitness data, and opportunity applications, while giving clubs and scouts tools to discover, shortlist, message, and evaluate talent.

The repo is organized as a full-stack monorepo with web, mobile, API, and database assets.

## Product Shape

ScoutX supports four main roles:

- `athlete`: builds a public sporting profile, records career and fitness data, applies to opportunities, joins challenges, and appears on leaderboards.
- `club`: publishes trials and opportunities, discovers athletes, shortlists candidates, manages a recruitment pipeline, and verifies/certifies performance data.
- `scout`: searches and reviews athletes, opportunities, feeds, and profiles.
- `admin`: manages users, athlete/club verification, platform analytics, and audit-style oversight through the Admin ERP area.

## Current Features

- Auth with JWT login/register, Supabase-backed session support, and role-based route protection.
- Athlete profiles with personal details, sport/position, stats, career timeline, highlight reel, skills, recommendations, profile views, and analytics.
- Club profiles with public club pages and club-owned dashboard workflows.
- Athlete discovery and filtering for clubs/scouts.
- Opportunity and trial listings, applications, application status changes, and club shortlists.
- Feed posts for authenticated platform users.
- Direct messaging conversations between platform users.
- Fitness tests with automatic athlete fitness score recalculation.
- Fitness assessment foundation for richer video/AI assessment payloads.
- Gamification: challenges, challenge progress, leaderboards, achievements, and user achievement unlocks.
- Admin ERP screens for overview, users, athletes, clubs, verification, and analytics.
- Media upload integration hooks through Cloudinary.
- Supabase client support alongside the PostgreSQL-backed Express API.
- Expo mobile app with auth, discover, feed, trials, messages, profile, club pipeline, and admin hub screens.

## Workflow Map

ScoutX is built around a small set of end-to-end journeys:

- Public entry starts at the landing page, where a visitor can go to `login` or `signup`, or open a public club profile.
- Authentication is role-based. The signup screen supports `athlete` and `club`, while login returns the user to the correct shell for their role and respects the explicit `users.onboarding_completed` flag.
- Startup onboarding is role-specific. Athletes complete a multi-step setup that captures profile basics, career history, and fitness baselines. Clubs complete a shorter setup that creates the club profile and then enters the dashboard. The startup gate now uses the account-level onboarding flag instead of inferring completion from placeholder profile data.
- The feed lets authenticated users publish text, image, video, or carousel posts, then react with likes and comments. Post sharing is link-based and posts are visible to other authenticated users.
- Athlete profiles show public data, career history, fitness results, strengths, availability, and follow/message actions. Owners can edit their own profile.
- Club workflows split into discovery and pipeline management. Clubs can browse athletes, filter by position, city, and fitness, post opportunities, review applications, shortlist athletes, and move applications through stages.
- Messaging is a direct conversation flow between authenticated users, with conversation lists, unread counts, and per-thread message views.
- Gamification covers challenges, challenge progress, leaderboards, and achievements.
- Admin flows cover overview, users, athlete and club verification, audit logs, and management screens.

## Implementation Notes

- The app currently uses a hybrid data path. Some flows run through the Express API and PostgreSQL models, while several web screens read and write directly through Supabase.
- Authentication middleware now accepts both legacy JWT tokens and Supabase access tokens so the web shell and backend routes can interoperate.
- Onboarding completion is stored explicitly on `public.users` and mirrored on the athlete and club profile rows so the redirect logic stays deterministic.
- The live web feed path is the Supabase-backed frontend flow. The older backend feed model is still present in the repo, but it does not match the current web schema and is not the source of truth for the feed UI.
- The current frontend no longer includes the old separate feed composer/post-card implementation or the unused highlight stub. The live feed and profile surfaces are the ones that matter now.
- Some UI text has been trimmed where it pointed at routes that are not shipped in the current app.

## Tech Stack

- `backend/`: Node.js, Express, PostgreSQL, Socket.IO, JWT, bcrypt, Joi, Cloudinary, Resend, Supabase client.
- `frontend/`: React, Vite, React Router, TanStack Query, Axios, Zustand, Recharts, Tailwind CSS, lucide-react, Supabase client.
- `mobile/`: Expo, React Native, Zustand, Axios, Supabase client.
- `supabase/`: Supabase local project config and migrations.
- `docker-compose.yml`: optional local PostgreSQL service.

## Repository Layout

```text
backend/
  src/
    app.js                  Express app and API route registration
    server.js               HTTP + Socket.IO server
    controllers/            Request handlers
    models/                 PostgreSQL data access
    routes/                 API route modules
    services/               Domain services for notifications, search, gamification
    db/migrations/          PostgreSQL schema migrations
    db/seeds/               Seed data
frontend/
  src/
    App.jsx                 Web route map and protected layouts
    api/                    Axios/Supabase API clients
    components/             Shared UI and domain components
    pages/                  Web screens and admin ERP pages
mobile/
  src/
    navigation/             Authenticated and auth navigation
    screens/                Mobile screens
    store/                  Mobile state
supabase/
  migrations/               Supabase SQL migrations
```

## Local Setup

Prerequisites:

- Node.js 20+
- npm
- PostgreSQL, either local or via Docker

Start a local database:

```bash
docker compose up -d postgres
```

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Mobile:

```bash
cd mobile
npm install
npm start
```

Default local services:

- Backend API: `http://localhost:5000`
- Web app: Vite local dev URL, `http://localhost:3000`
- Optional local Postgres: `localhost:5432`, database `scoutx`

## Key Backend API Areas

- `GET /health`
- `/api/auth`
- `/api/athletes`
- `/api/careers`
- `/api/clubs`
- `/api/fitness`
- `/api/opportunities`
- `/api/feed`
- `/api/messages`
- `/api/admin`
- `/api/uploads`
- `/api/challenges`
- `/api/leaderboards`
- `/api/achievements`

Most API routes require a bearer token and enforce role-based access through the backend auth/RBAC middleware.

## Notes

- The current codebase includes both direct PostgreSQL models and Supabase client setup. The main Express API currently uses PostgreSQL models for most domain data.
- Socket.IO is initialized in the backend server and currently emits a basic connection event; richer real-time messaging is marked as future work.
- Fitness AI assessment processing is scaffolded with environment variables for a Python assessor service and callback secret, with local/mock development behavior implied by the env comments.
