# Prepzo — AI Technical Interview Preparation Platform

Prepzo is a full-stack web application designed to simulate technical interviews for software engineering roles. It supports structured mock rounds across **Data Structures & Algorithms (DSA)**, **System Design**, **SQL & Database Queries**, and **Resume Defense**, providing company-specific questions, real-time voice input, and structured evaluation rubrics.

**Live Application:** [prepzo-one.vercel.app](https://prepzo-one.vercel.app/)  
**Repository:** [github.com/AdityaMani-2003/Prepzo](https://github.com/AdityaMani-2003/Prepzo)

---

## Architecture Overview

Prepzo uses Next.js 16 App Router with React 19 on the frontend and Supabase (PostgreSQL with Row-Level Security) for authentication and data storage. AI evaluation and question streaming are powered by Google Gemini 2.5 Flash via Next.js Route Handlers using Server-Sent Events (SSE).

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React 19)                        │
│  - Live Interview Arena (Monaco / Code Editor, Timer)       │
│  - Web Audio API + Web Speech Recognition (Voice Input)     │
│  - Real-time SSE Stream Consumption                         │
└──────────────┬──────────────────────────────┬───────────────┘
               │ HTTPS                        │ SSE Stream
┌──────────────▼──────────────────────────────▼───────────────┐
│              Next.js 16 App Router (Vercel)                 │
│  - Route Handlers (/api/question, /api/evaluate, etc.)      │
│  - Server Actions & Edge Middleware Auth Check              │
│  - Prompt Services (Role/Company Context Injection)         │
└──────────────┬──────────────────────────────┬───────────────┘
               │ SQL Queries (RLS)            │ REST / Streaming
┌──────────────▼─────────────┐ ┌──────────────▼───────────────┐
│     Supabase Cloud         │ │     Google DeepMind          │
│  - PostgreSQL 15 Database  │ │  - Gemini 2.5 Flash Model    │
│  - Google OAuth / PKCE     │ │  - Structured JSON Output    │
│  - Row-Level Security (RLS)│ │  - Streaming SSE Responses   │
└────────────────────────────┘ └──────────────────────────────┘
```

---

## Core Features & How They Work

### 1. Multi-Track Interview Arenas
- **Coding & DSA:** Presents algorithmic challenges with test cases, constraints, and runtime/memory expectations. Candidates can write code and explain logic verbally.
- **SQL & Schema Design:** Presents relational schemas and business requirements, testing JOINs, aggregation, indexing, and query optimization.
- **System Design:** Evaluates high-level architectures, scaling trade-offs, load balancing, caching strategies, and database partitioning.
- **Resume Defense:** Candidates upload a resume (PDF). The parser extracts technical claims and projects, then generates targeted probing questions to verify genuine hands-on experience.

### 2. Company & Role Calibration
Interviews can be configured for specific companies (e.g., Google, Amazon, startups) and target seniorities. System prompts inject company-specific evaluation criteria:
- Google style: Algorithmic correctness, edge cases, Big-O proof.
- Amazon style: Leadership principles, scalability, operational metrics.
- Startups: Pragmatism, speed, framework fundamentals.

### 3. Voice & Audio Interaction
- Uses browser-native Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for spoken responses.
- Allows candidates to practice articulating thought processes aloud under timed conditions.

### 4. Evaluation Rubrics & Structured Scoring
Upon response submission, `/api/evaluate` runs candidate input through a multi-dimensional rubric:
- **Correctness & Accuracy:** Did the solution solve the core problem?
- **Depth & Fundamentals:** Did the candidate understand the underlying mechanisms?
- **Communication:** Was the explanation structured and concise?
- **Complexity:** Are time and space complexities optimal?
Scores and feedback are saved in PostgreSQL for historical tracking.

---

## Database Schema (Supabase PostgreSQL)

All tables enforce strict Row-Level Security (RLS). Users can only access their own interview sessions and messages.

### `interview_sessions`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | Unique session identifier (`gen_random_uuid()`) |
| `user_id` | `UUID (FK)` | References `auth.users.id` |
| `round_type` | `TEXT` | `coding`, `system_design`, `sql`, `resume` |
| `target_company`| `TEXT` | Target company context (e.g. "Google", "General") |
| `difficulty` | `TEXT` | `entry`, `mid`, `senior` |
| `status` | `TEXT` | `in_progress`, `completed`, `abandoned` |
| `overall_score` | `NUMERIC` | Composite score (0–100) |
| `created_at` | `TIMESTAMPTZ` | Session start timestamp |

### `interview_messages`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | Unique message identifier |
| `session_id` | `UUID (FK)` | References `interview_sessions.id` |
| `sender` | `TEXT` | `ai` or `user` |
| `content` | `TEXT` | Question text, answer transcription, or feedback |
| `evaluation` | `JSONB` | Structured scores, strengths, and areas to improve |
| `created_at` | `TIMESTAMPTZ` | Message timestamp |

---

## API Endpoints

| Route | Method | Purpose | Payload Summary |
| :--- | :--- | :--- | :--- |
| `/api/question` | `POST` | Generate initial question | `{ roundType, company, difficulty, role }` |
| `/api/stream-question` | `POST` | Stream question via SSE | `{ roundType, company, difficulty, role }` |
| `/api/evaluate` | `POST` | Evaluate submitted response | `{ sessionId, question, answer, roundType }` |
| `/api/follow-up` | `POST` | Generate counter-question | `{ sessionId, previousMessages, answer }` |
| `/api/parse-resume` | `POST` | Extract text from uploaded PDF | `FormData (file: PDF)` |
| `/api/resume/analyze` | `POST` | Extract project claims to grill | `{ resumeText }` |
| `/api/improvement-plan`| `POST` | Generate personalized study plan| `{ userHistory, targetRole }` |

---

## Project Structure

```
Prepzo/
├── app/
│   ├── (auth)/
│   │   └── login/                 # Supabase Google OAuth login page
│   ├── (dashboard)/
│   │   ├── dashboard/             # Overview metrics & quick-start cards
│   │   ├── history/               # Past interview logs and review modal
│   │   ├── interview/             # Configuration modal (round, company, level)
│   │   │   └── live/              # Active interview arena (timer, speech, editor)
│   │   ├── progress/              # Score distribution & category charts
│   │   ├── resume/                # Resume upload & defense preparation
│   │   └── settings/              # Account preferences
│   ├── api/                       # Route handlers (AI generation, scoring, parsing)
│   ├── auth/                      # OAuth callback & signout handlers
│   └── globals.css                # Tailwind CSS v4 styles & design tokens
├── components/                    # Modular UI components
├── hooks/                         # Custom hooks (speech, audio recording, auth)
├── lib/                           # Supabase client & Gemini SDK initialization
├── services/                      # Prompt builders, evaluation logic, scoring
├── supabase/                      # Database migrations, RLS policies, schemas
└── types/                         # TypeScript definitions
```

---

## Local Development Setup

### Prerequisites
- Node.js 18.x or later
- A Supabase project with PostgreSQL
- A Google Gemini API key

### 1. Clone & Install
```bash
git clone https://github.com/AdityaMani-2003/Prepzo.git
cd Prepzo
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-google-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Technical Study & Interview Notes

### Why Server-Sent Events (SSE) instead of standard REST?
For AI interview questions, generating a full scenario or coding problem takes 3–6 seconds. Using SSE streams chunks progressively to the browser within 300ms, significantly improving perceived latency and user experience.

### How Data Isolation is Enforced:
Rather than relying solely on application-level filtering (`where user_id = current_user`), Supabase RLS enforces security at the PostgreSQL database engine level:
```sql
CREATE POLICY "Users can only view their own sessions"
ON interview_sessions FOR SELECT
USING (auth.uid() = user_id);
```
Even if an API route had an authorization bug, the database would reject cross-tenant reads or writes.

---

## License
MIT
