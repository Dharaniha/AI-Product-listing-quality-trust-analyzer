# TrustLens AI — Product Listing Quality & Trust Analyzer

An AI-powered marketplace listing intelligence platform that evaluates listings for completeness, suspicious patterns, poor descriptions, and trustworthiness — while recommending improvements.

---

## 🚀 Live Demo

> Run locally using the setup instructions below.

---

## 🧠 What It Does

- **Trust Score** — Composite score (0–100) based on completeness, description quality, duplicate risk, and suspicious content
- **AI Description Scoring** — Groq LLaMA 3.3 70B analyzes listing quality and generates improvement suggestions
- **Missing Information Detection** — Identifies incomplete or absent fields that reduce buyer trust
- **Suspicious Content Detection** — Scans for fraud signals, scam patterns, and off-platform contact requests
- **Duplicate Listing Alerts** — Compares listings against marketplace reference data
- **Image Upload** — Real product images stored in Supabase Storage
- **Trust Dashboard** — Trend charts, quality distribution, and risk analysis
- **PDF Export** — Download full trust reports

---

## 🏗️ Architecture

```
Frontend (React + Vite)     →     Backend (Node.js + Express)     →     AI Service (Groq)
      Port 5173                         Port 5000                           Port 3001
                                            ↓
                                    Supabase (PostgreSQL)
                                    Supabase Storage (Images)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, JWT Auth, Multer |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| AI Layer | Groq API (LLaMA 3.3 70B) |
| Auth | JWT + bcrypt |

---

## 📁 Project Structure

```
AI-Product-listing-quality-trust-analyzer/
├── Backend/                    # Node.js Express API
│   ├── src/
│   │   ├── config/             # Supabase + app config
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth, rate limiting, validation
│   │   ├── repositories/       # Supabase database operations
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic + AI orchestration
│   │   └── utils/              # Helpers and scoring engines
│   └── .env.example
│
├── ai-service/                 # Groq AI microservice
│   └── backend/
│       ├── server.js           # Express API calling Groq LLaMA
│       └── .env.example
│
├── frontend/                   # React + Vite frontend
│   └── trustlens-ai/
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   ├── context/        # React Context (Auth, Listing, Analysis)
│       │   ├── pages/          # Route pages (Dashboard, NewListing, Results...)
│       │   ├── services/       # API service layer
│       │   └── utils/          # Scoring engines (completeness, duplicates...)
│       └── .env.example
│
├── database/                   # Supabase schema and seed scripts
└── supabase/                   # Supabase project config
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key (free)

---

### 1. Clone the repository

```bash
git clone https://github.com/Dharaniha/AI-Product-listing-quality-trust-analyzer.git
cd AI-Product-listing-quality-trust-analyzer
```

---

### 2. Set up the Backend

```bash
cd Backend
npm install
```

Create a `.env` file (copy from `.env.example`):

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
AI_SERVICE_URL=http://localhost:3001
```

Start the backend:

```bash
npm run dev
```

---

### 3. Set up the AI Service

```bash
cd ai-service/backend
npm install
```

Create a `.env` file in `ai-service/` (one level above `backend/`):

```env
AI_API_KEY=your_groq_api_key_here
PORT=3001
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

Start the AI service:

```bash
node server.js
```

---

### 4. Set up the Frontend

```bash
cd frontend/trustlens-ai
npm install
```

Create a `.env` file:

```env
VITE_API_URL=/api
```

Start the frontend:

```bash
npm run dev
```

---

### 5. Set up Supabase

Run the following in your Supabase **SQL Editor**:

```sql
-- Users table
CREATE TABLE users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  plan text DEFAULT 'Pro',
  created_at timestamptz DEFAULT now()
);

-- Listings table
CREATE TABLE listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  product_name text,
  category text,
  brand text,
  model text,
  condition text,
  age text,
  warranty text,
  description text,
  image_urls text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analyses table
CREATE TABLE analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  listing_name text,
  trust_score numeric,
  trust_level text,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;
```

Create a **Storage bucket** named `listing-images` (set to Public).

---

## 🚦 Running the Full Stack

Open **3 terminal windows** and run:

| Terminal | Command | Port |
|---|---|---|
| 1 | `cd ai-service/backend && node server.js` | 3001 |
| 2 | `cd Backend && npm run dev` | 5000 |
| 3 | `cd frontend/trustlens-ai && npm run dev` | 5173 |

Then open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📊 Trust Score Formula

```
Trust Score = 40% Completeness
            + 30% Description Quality (blended with AI score)
            + 20% (100 − Duplicate Risk)
            + 10% (100 − Suspicious Risk)
```

| Score | Level |
|---|---|
| 90–100 | ✅ Trusted |
| 70–89 | 🟡 Good |
| 50–69 | 🟠 Needs Review |
| < 50 | 🔴 High Risk |

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/listings` | Create listing |
| GET | `/api/listings` | Get user listings |
| POST | `/api/analysis/run` | Run full AI analysis |
| GET | `/api/analysis/history` | Get analysis history |
| DELETE | `/api/analysis/:id` | Delete analysis |
| GET | `/api/trust-center/stats` | Get dashboard stats |

---

## 👥 Team

| Role | Responsibility |
|---|---|
| Frontend | React + Tailwind UI (completed) |
| Backend | Node.js + Express API |
| Database | Supabase schema + storage |
| AI Layer | Groq integration + scoring |

---

## 📄 License

MIT
