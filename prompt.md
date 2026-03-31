# ScoutX — Cursor Master Prompt
# Paste this entire file into Cursor's AI pane or use as your first message in Composer.
# After pasting, Cursor will understand the full project and build consistently.

═══════════════════════════════════════════════════════════════
PART 1 — PROJECT IDENTITY
═══════════════════════════════════════════════════════════════

You are building ScoutX — a LinkedIn-style sports discovery platform for
football (soccer) players and clubs in India. Think of it as "LinkedIn for
athletes". The platform has three apps sharing one codebase (monorepo):

  1. backend/   → Node.js + Express REST API
  2. frontend/  → React + Vite web app
  3. mobile/    → React Native + Expo mobile app

The product solves a real problem: talented grassroots football players in
India have no digital presence, so scouts can't find them. ScoutX gives
athletes a verified profile, career history, and fitness scores — and gives
clubs a powerful search and recruitment pipeline.

CURRENT PHASE: MVP — India-first, football-only.


═══════════════════════════════════════════════════════════════
PART 2 — TECH STACK (follow this exactly, no substitutions)
═══════════════════════════════════════════════════════════════

BACKEND
  Runtime:        Node.js v20 + Express.js
  Database:       PostgreSQL (use the 'pg' package, no ORM)
  Auth:           JWT (jsonwebtoken) + bcrypt for password hashing
  File uploads:   Multer → Cloudinary (videos + profile images)
  Email:          Resend (transactional emails)
  Real-time:      Socket.io (messaging)
  Validation:     Joi
  Environment:    dotenv

FRONTEND
  Framework:      React 18 + Vite
  Styling:        Tailwind CSS
  Routing:        React Router v6
  Data fetching:  Axios + TanStack Query (React Query v5)
  State:          Zustand
  Charts:         Recharts
  Icons:          Lucide React
  Forms:          React Hook Form + Zod

MOBILE
  Framework:      React Native + Expo (SDK 51)
  Navigation:     Expo Router (file-based)
  Styling:        NativeWind (Tailwind for React Native)
  Push notifs:    Expo Notifications + Firebase Cloud Messaging
  State + data:   Same Zustand + Axios + React Query as web

NEVER use:
  - TypeScript (JavaScript only, for simplicity)
  - Prisma or any ORM (raw SQL with pg)
  - Redux (use Zustand)
  - Create React App (use Vite)
  - class components (functional components only)


═══════════════════════════════════════════════════════════════
PART 3 — FOLDER STRUCTURE (create exactly this)
═══════════════════════════════════════════════════════════════

scoutx/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               ← PostgreSQL pool connection
│   │   │   └── cloudinary.js       ← Cloudinary setup
│   │   ├── controllers/            ← Business logic (one file per resource)
│   │   │   ├── auth.controller.js
│   │   │   ├── athlete.controller.js
│   │   │   ├── club.controller.js
│   │   │   ├── opportunity.controller.js
│   │   │   ├── fitness.controller.js
│   │   │   ├── feed.controller.js
│   │   │   └── message.controller.js
│   │   ├── routes/                 ← Express routes (one file per resource)
│   │   │   ├── auth.routes.js
│   │   │   ├── athlete.routes.js
│   │   │   ├── club.routes.js
│   │   │   ├── opportunity.routes.js
│   │   │   ├── fitness.routes.js
│   │   │   ├── feed.routes.js
│   │   │   └── message.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.js             ← JWT verification middleware
│   │   │   ├── rbac.js             ← Role-based access control
│   │   │   └── upload.js           ← Multer config
│   │   ├── models/                 ← Raw SQL query functions
│   │   │   ├── user.model.js
│   │   │   ├── athlete.model.js
│   │   │   ├── club.model.js
│   │   │   ├── career.model.js
│   │   │   └── fitness.model.js
│   │   ├── services/
│   │   │   ├── email.service.js
│   │   │   ├── notification.service.js
│   │   │   └── search.service.js
│   │   ├── utils/
│   │   │   ├── fitnessScore.js     ← Composite score calculator
│   │   │   └── validators.js
│   │   ├── db/
│   │   │   ├── migrations/         ← SQL migration files (001_init.sql etc)
│   │   │   └── seeds/              ← Sample data for development
│   │   ├── app.js                  ← Express app setup
│   │   └── server.js               ← Entry point
│   ├── .env                        ← Secret keys (in .gitignore)
│   ├── .env.example                ← Template (committed to git)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js            ← Axios instance with base URL + auth header
│   │   │   ├── auth.api.js
│   │   │   ├── athlete.api.js
│   │   │   └── club.api.js
│   │   ├── components/
│   │   │   ├── ui/                 ← Button, Input, Tag, Card, Modal, Avatar
│   │   │   ├── athlete/            ← ProfileHero, CareerTimeline, FitnessPanel, SkillsPanel, HighlightReel
│   │   │   ├── club/               ← SearchFilters, AthleteCard, PipelineBoard, PostTrialForm
│   │   │   ├── feed/               ← PostCard, Composer, StoryRow
│   │   │   └── shared/             ← Sidebar, Topbar, ProtectedRoute
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Feed.jsx
│   │   │   ├── AthleteProfile.jsx
│   │   │   ├── ClubDashboard.jsx
│   │   │   ├── Discover.jsx
│   │   │   ├── Opportunities.jsx
│   │   │   ├── Messages.jsx
│   │   │   └── Analytics.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useAthletes.js
│   │   │   └── useMessages.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── store/
│   │   │   └── useStore.js         ← Zustand store (user, notifications, ui)
│   │   ├── utils/
│   │   │   ├── format.js
│   │   │   └── roles.js
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.jsx                 ← Router setup + layout
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── FeedScreen.jsx
│   │   │   ├── ProfileScreen.jsx
│   │   │   ├── DiscoverScreen.jsx
│   │   │   ├── TrialsScreen.jsx
│   │   │   ├── MessagesScreen.jsx
│   │   │   └── auth/
│   │   │       ├── LoginScreen.jsx
│   │   │       └── SignupScreen.jsx
│   │   ├── navigation/
│   │   │   ├── AppNavigator.jsx    ← Bottom tab + stack navigator
│   │   │   └── AuthNavigator.jsx
│   │   ├── components/             ← Mobile-specific UI components
│   │   ├── api/                    ← Same as frontend/api (copy or symlink)
│   │   └── store/                  ← Same Zustand store
│   ├── App.jsx
│   ├── app.json
│   └── package.json
│
├── .gitignore
├── README.md
└── docker-compose.yml              ← Optional: run postgres locally


═══════════════════════════════════════════════════════════════
PART 4 — DATABASE SCHEMA (build these tables in order)
═══════════════════════════════════════════════════════════════

-- 1. users (base auth record for everyone)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('athlete','club','scout','admin')),
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 2. athlete_profiles
CREATE TABLE athlete_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL,
  sport           VARCHAR(50) DEFAULT 'football',
  position        VARCHAR(100),
  city            VARCHAR(100),
  state           VARCHAR(100),
  date_of_birth   DATE,
  age_verified    BOOLEAN DEFAULT false,
  preferred_foot  VARCHAR(10) CHECK (preferred_foot IN ('left','right','both')),
  height_cm       INTEGER,
  weight_kg       INTEGER,
  bio             TEXT,
  headline        VARCHAR(255),
  avatar_url      VARCHAR(500),
  is_open         BOOLEAN DEFAULT false,
  fitness_score   INTEGER DEFAULT 0,
  total_matches   INTEGER DEFAULT 0,
  total_goals     INTEGER DEFAULT 0,
  total_assists   INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 3. club_profiles
CREATE TABLE club_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  club_name     VARCHAR(255) NOT NULL,
  league        VARCHAR(255),
  city          VARCHAR(100),
  state         VARCHAR(100),
  founded_year  INTEGER,
  logo_url      VARCHAR(500),
  bio           TEXT,
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 4. career_entries
CREATE TABLE career_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  club_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(100),
  competition   VARCHAR(255),
  start_date    DATE NOT NULL,
  end_date      DATE,
  matches       INTEGER DEFAULT 0,
  goals         INTEGER DEFAULT 0,
  assists       INTEGER DEFAULT 0,
  clean_sheets  INTEGER DEFAULT 0,
  pass_accuracy DECIMAL(5,2),
  avg_rating    DECIMAL(3,2),
  is_verified   BOOLEAN DEFAULT false,
  is_current    BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 5. fitness_tests
CREATE TABLE fitness_tests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  test_type     VARCHAR(50) NOT NULL,
  score         DECIMAL(10,3) NOT NULL,
  unit          VARCHAR(30),
  tested_at     TIMESTAMP DEFAULT NOW(),
  location      VARCHAR(255),
  certified_by  UUID REFERENCES users(id),
  notes         TEXT
);

-- 6. skills_endorsements
CREATE TABLE skills_endorsements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  skill_name    VARCHAR(100) NOT NULL,
  endorsed_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(athlete_id, skill_name, endorsed_by)
);

-- 7. recommendations
CREATE TABLE recommendations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  is_visible    BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 8. opportunities (trial listings posted by clubs)
CREATE TABLE opportunities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         UUID REFERENCES club_profiles(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  position        VARCHAR(100),
  contract_type   VARCHAR(50),
  trial_date      DATE,
  venue           VARCHAR(255),
  description     TEXT,
  min_fitness     INTEGER,
  max_age         INTEGER,
  min_height_cm   INTEGER,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  expires_at      DATE
);

-- 9. applications
CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  status        VARCHAR(30) DEFAULT 'applied' CHECK (status IN ('applied','reviewing','invited','rejected','signed')),
  applied_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(opportunity_id, athlete_id)
);

-- 10. connections
CREATE TABLE connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- 11. posts (feed)
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  body          TEXT,
  media_url     VARCHAR(500),
  media_type    VARCHAR(20),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 12. shortlists (club saves athlete)
CREATE TABLE shortlists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       UUID REFERENCES club_profiles(id) ON DELETE CASCADE,
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  stage         VARCHAR(30) DEFAULT 'applied' CHECK (stage IN ('applied','reviewing','invited','signed')),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, athlete_id)
);


═══════════════════════════════════════════════════════════════
PART 5 — USER ROLES & ACCESS RULES
═══════════════════════════════════════════════════════════════

There are 4 roles. Enforce these in rbac.js middleware:

  athlete    → Can edit own profile, post to feed, apply to opportunities,
               view other athletes, message connections, see own analytics

  club       → Can search/filter ALL athletes, shortlist, manage pipeline,
               post trial listings, message any athlete, see club analytics.
               This is the "special access" tier — treat it as premium.

  scout      → Can search athletes, shortlist, message, view profiles.
               Cannot post trial listings.

  admin      → Full access to everything. Used only by you internally.

PROTECTED ROUTES:
  /discover          → club + scout only
  /club/dashboard    → club only
  /analytics         → athlete sees own stats, club sees club stats


═══════════════════════════════════════════════════════════════
PART 6 — DESIGN SYSTEM (keep this consistent across all UI)
═══════════════════════════════════════════════════════════════

THEME: Dark, bold, athletic. Like a premium sports app.

COLORS (use as Tailwind custom tokens in tailwind.config.js):
  Background:    #060810  (darkest — page bg)
  Surface:       #0c1018  (cards, sidebars)
  Raised:        #111722  (elevated cards)
  Border:        #1d2535  (subtle dividers)
  Accent Green:  #c6f135  (primary CTA, athlete theme)  → 'lime' in Tailwind
  Accent Orange: #ff8c42  (club theme, fitness scores)  → 'ember' custom
  Accent Teal:   #4ecdc4  (secondary info)
  Text 1:        #edf2ff  (headings, primary text)
  Text 2:        #8892a4  (secondary text, labels)
  Text 3:        #4a5568  (muted, hints)

FONTS (add to index.html via Google Fonts):
  Display:   'Bebas Neue'      → headings, stats numbers, names
  Body:      'Syne'            → all UI text, labels, buttons
  Mono:      'JetBrains Mono'  → stats numbers, dates, scores, code

COMPONENT RULES:
  - Buttons: rounded-md, font-bold, tracking-wide, uppercase for primary CTAs
  - Cards: bg-surface + border border-edge + rounded-xl
  - Athlete theme accent: lime (#c6f135)
  - Club theme accent: ember (#ff8c42)
  - Always show "Open to Opportunities" as a pulsing green dot when active
  - Fitness score always shown in ember/orange
  - Verified badge always in lime/green


═══════════════════════════════════════════════════════════════
PART 7 — KEY BUSINESS LOGIC (build these correctly)
═══════════════════════════════════════════════════════════════

1. FITNESS SCORE CALCULATION (in utils/fitnessScore.js)
   Composite 0–100 score from multiple tests:
   - Sprint 40m:      weight 20%  (lower is better — normalize against 4.5s benchmark)
   - VO2 Max:         weight 25%  (higher is better — normalize against 60 ml/kg/min)
   - Illinois Agility: weight 20% (lower is better — normalize against 14.5s)
   - Vertical Jump:   weight 15%  (higher is better — normalize against 70cm)
   - Yo-Yo Test:      weight 20%  (higher level is better)
   After each fitness_tests insert, recalculate and UPDATE athlete_profiles.fitness_score

2. ATHLETE SEARCH & FILTERING (in services/search.service.js)
   Support these query params on GET /api/athletes:
   - position (string match)
   - minAge, maxAge (calculate from date_of_birth)
   - state (exact match)
   - minFitness (fitness_score >=)
   - isOpen (is_open = true)
   - sport (default 'football')
   - sortBy: fitness_desc | matches_desc | recent
   - page, limit (pagination, default limit 20)
   Return: athletes array + total count + pagination info

3. ROLE-BASED AUTH (in middleware/rbac.js)
   export const requireRole = (...roles) => (req, res, next) => {
     if (!roles.includes(req.user.role)) {
       return res.status(403).json({ error: 'Access denied' })
     }
     next()
   }
   Usage in routes: router.get('/discover', auth, requireRole('club','scout'), ...)

4. JWT MIDDLEWARE (in middleware/auth.js)
   Verify Bearer token from Authorization header.
   Attach decoded user to req.user.
   Return 401 if missing or invalid.

5. AGE VERIFICATION
   For MVP: accept Aadhaar number + date of birth from athlete.
   Store in athlete_profiles: age_verified = true, date_of_birth = submitted date.
   (Full Aadhaar API integration comes in v2 — flag with TODO comment)

6. PROFILE ANALYTICS
   Track these events in a profile_views table:
   - When any user views an athlete profile, log: viewer_id, athlete_id, timestamp, viewer_role
   - Aggregate for GET /api/athletes/:id/analytics:
     total views, views by scouts/clubs, views this week, search appearances


═══════════════════════════════════════════════════════════════
PART 8 — API RESPONSE FORMAT (use this everywhere)
═══════════════════════════════════════════════════════════════

Always return this shape from every endpoint:

// Success
res.json({
  success: true,
  data: { ... },         // the actual response data
  message: 'Optional message'
})

// Error
res.status(400).json({
  success: false,
  error: 'Human readable error message'
})

// Paginated list
res.json({
  success: true,
  data: [ ... ],
  pagination: {
    total: 247,
    page: 1,
    limit: 20,
    totalPages: 13
  }
})


═══════════════════════════════════════════════════════════════
PART 9 — .ENV TEMPLATE (create backend/.env.example)
═══════════════════════════════════════════════════════════════

# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/scoutx

# Auth
JWT_SECRET=replace_with_a_long_random_string_minimum_32_chars
JWT_EXPIRES_IN=7d

# Cloudinary (media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend (emails)
RESEND_API_KEY=re_your_key

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000


═══════════════════════════════════════════════════════════════
PART 10 — CODING STANDARDS (follow these in every file)
═══════════════════════════════════════════════════════════════

1. Every async route handler wrapped in try/catch
2. Never put logic in routes — routes call controllers only
3. Never put SQL in controllers — controllers call models only
4. All SQL in models/ as named exported functions
5. Destructure req.body at top of every controller function
6. Use const everywhere, never var
7. Async/await only, never .then().catch() chains
8. Add a // TODO: comment wherever v2 features will go
9. Every model function takes only plain arguments (no req/res)
10. Log errors with console.error() in catch blocks (proper logger in v2)

EXAMPLE PATTERN (follow this for every resource):

// models/athlete.model.js
const { pool } = require('../config/db')

const getAthleteById = async (id) => {
  const result = await pool.query(
    'SELECT ap.*, u.email FROM athlete_profiles ap JOIN users u ON u.id = ap.user_id WHERE ap.id = $1',
    [id]
  )
  return result.rows[0] || null
}

module.exports = { getAthleteById }

// controllers/athlete.controller.js
const AthleteModel = require('../models/athlete.model')

const getProfile = async (req, res) => {
  try {
    const { id } = req.params
    const athlete = await AthleteModel.getAthleteById(id)
    if (!athlete) return res.status(404).json({ success: false, error: 'Athlete not found' })
    res.json({ success: true, data: athlete })
  } catch (err) {
    console.error('getProfile error:', err)
    res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = { getProfile }

// routes/athlete.routes.js
const express = require('express')
const router = express.Router()
const { getProfile } = require('../controllers/athlete.controller')
const auth = require('../middleware/auth')

router.get('/:id', auth, getProfile)

module.exports = router


═══════════════════════════════════════════════════════════════
PART 11 — BUILD ORDER (what to build first → last)
═══════════════════════════════════════════════════════════════

Follow this exact sequence. Do not skip ahead.

PHASE 1 — Foundation (do this first)
  [ ] Scaffold folder structure exactly as defined in Part 3
  [ ] Set up backend: Express app, DB connection, .env
  [ ] Run SQL migrations to create all tables from Part 4
  [ ] Build auth: register, login, JWT middleware, rbac middleware
  [ ] Test auth with Thunder Client or Postman before moving on

PHASE 2 — Core Backend
  [ ] athlete model + controller + routes (GET, PUT profile)
  [ ] career model + controller + routes (CRUD career entries)
  [ ] club model + controller + routes
  [ ] fitness model + controller + routes + score calculator
  [ ] search service (athlete filtering with all params)
  [ ] opportunities CRUD
  [ ] applications (apply to opportunity, update status)
  [ ] shortlists + pipeline stages

PHASE 3 — Frontend Foundation
  [ ] Vite + Tailwind + custom color tokens setup
  [ ] Axios instance + AuthContext + Zustand store
  [ ] Login + Signup pages (with role selection: athlete / club)
  [ ] ProtectedRoute component
  [ ] Sidebar + Topbar shared layout

PHASE 4 — Frontend Pages (build in this order)
  [ ] AthleteProfile page (most important — the core product)
  [ ] Discover page (club search + filters)
  [ ] ClubDashboard (pipeline board + shortlist)
  [ ] Feed page
  [ ] Opportunities page
  [ ] Messages page
  [ ] Analytics page

PHASE 5 — Mobile App
  [ ] Expo setup + NativeWind + navigation
  [ ] LoginScreen + SignupScreen
  [ ] FeedScreen
  [ ] ProfileScreen
  [ ] DiscoverScreen
  [ ] TrialsScreen
  [ ] MessagesScreen
  [ ] Push notifications

PHASE 6 — Polish & Launch
  [ ] Profile analytics tracking
  [ ] Email notifications (trial invites, connections)
  [ ] Image/video upload to Cloudinary
  [ ] Deploy backend to Railway
  [ ] Deploy frontend to Vercel
  [ ] Submit mobile app to Expo (TestFlight / Play Store beta)


═══════════════════════════════════════════════════════════════
PART 12 — HOW TO USE THIS PROMPT IN CURSOR
═══════════════════════════════════════════════════════════════

STEP 1 — Project setup
  Open Cursor → New Window → Open Folder → create empty 'scoutx' folder
  Press Cmd+I (Mac) or Ctrl+I (Windows) to open Composer
  Paste this entire prompt into Composer
  Then add this instruction:

  "Read the entire prompt above. Then scaffold the complete folder
   structure from Part 3. Create every folder and an index.js or
   placeholder file in each. Then set up the backend package.json
   with all dependencies from Part 2 and create the app.js and
   server.js files following the coding standards in Part 10."

STEP 2 — Building features
  For each feature use this format in Cursor Composer:

  "Following the patterns and standards defined in the project prompt,
   build the [FEATURE NAME]. Specifically:
   - Create the model in models/X.model.js with these functions: [list]
   - Create the controller in controllers/X.controller.js
   - Create the routes in routes/X.routes.js
   - Wire it into app.js
   Refer to the example pattern in Part 10 of the prompt."

STEP 3 — Debugging
  Paste the error message and say:
  "This error occurred in [file]. Here is the error: [paste error].
   Fix it following our project conventions."

STEP 4 — Use @Codebase
  In Cursor, type @Codebase before your prompt to let Cursor read
  your entire project before answering. This gives much better results
  for refactoring and feature additions.

STEP 5 — Keep this file open
  Save this file as PROMPT.md in your scoutx/ root folder.
  Reference it in every Cursor session by starting with:
  "Read @PROMPT.md for full project context, then..."