<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
</p>

# Prepzo — AI-Powered Technical Interview Preparation SaaS

Prepzo is a full-stack, production-grade technical interview preparation platform designed to bridge the gap between candidate project claims and real hiring expectations. Grounded in actual company hiring standards, Prepzo delivers structured mock rounds across **Coding & DSA**, **SQL & Database Queries**, **Core CS Fundamentals**, **Resume Defense**, and **System Design**.

---

## 🏛️ System Architecture

```
                               ┌───────────────────────────────────────────────────────────┐
                               │                    Client Browser                         │
                               │  (React 19, Tailwind CSS v4, Web Audio, SpeechRecognition) │
                               └─────────────┬───────────────────────────────▲─────────────┘
                                             │                               │
                                             │ HTTPS / SSE Stream            │ Dynamic State
                                             ▼                               │
                               ┌─────────────────────────────────────────────┴─────────────┐
                               │             Next.js 16 (App Router + Turbopack)           │
                               │                                                           │
                               │  ┌────────────────────┐   ┌─────────────────────────────┐ │
                               │  │ proxy.ts           │   │ Server Actions & API Routes │ │
                               │  │ (Auth Guard / SSR) │   │ (/api/stream-question,      │ │
                               │  └─────────┬──────────┘   │  /api/evaluate,             │ │
                               │            │              │  /api/improvement-plan)     │ │
                               │            │              └──────────────┬──────────────┘ │
                               └────────────┼─────────────────────────────┼────────────────┘
                                            │                             │
                                            ▼                             ▼
                ┌──────────────────────────────────────┐     ┌────────────────────────────┐
                │          Supabase Backend            │     │       Google Gemini        │
                │  - PostgreSQL (Row-Level Security)   │     │  - 2.5 Flash SDK           │
                │  - pgvector (Resume Embeddings)      │     │  - Real-Time Question Gen  │
                │  - Auth (Google OAuth & SSR Cookies) │     │  - Evaluation & Solutions  │
                └──────────────────────────────────────┘     └────────────────────────────┘
```

---

## ⚡ Core Engineering Highlights

### 1. Grounded Company Intelligence Engine
Unlike generic chatbots that output unstructured scenario prompts, Prepzo features a dedicated company interview database (`lib/companyData.ts`) covering tier-specific hiring standards:
* **FAANG / Big Tech (Google, Meta, Amazon)**: High algorithmic rigor, graph/tree traversals, time/space invariant checking, Leadership Principles (STAR format), and high-throughput system scaling.
* **Top-Tier Fintech & Infrastructure (Stripe, Goldman Sachs)**: API idempotency, ACID transaction boundaries, analytical SQL window functions (`ROW_NUMBER`, `DENSE_RANK`), and concurrency safety.
* **Enterprise & IT Services (TCS, Infosys, Wipro)**: Core computer science fundamentals (OOPs abstraction vs polymorphism, DBMS indexing, OS memory/process management, networking).
* **High-Growth Startups**: Pragmatic full-stack decision-making, ORM N+1 query resolution, and multi-tenant schema tradeoffs.

### 2. Multi-Track Interview Arenas
Prepzo supports 7 dedicated interview tracks with role and seniority calibration:
* **Coding & Algorithms (DSA)**: Concrete problems with explicit constraints, input/output samples, and an integrated **Code Mode** editor.
* **SQL & Database Systems**: Practical business schemas, analytics objectives, and indexing queries.
* **Core CS Fundamentals**: Operating systems, relational databases, networking protocols, and object-oriented design.
* **Resume Project Defense**: Parses uploaded PDFs and challenges candidates to defend their architectural choices, caching layers, and bottlenecks.
* **System Design & Distributed Systems**: Scalability, database sharding, and latency optimization.
* **Behavioral & HR (STAR)**: Company-specific situational questions evaluating communication structure and ownership.

### 3. Dimensional Scoring & Benchmark Solutions
Evaluations provide objective analysis rather than generic praise:
* **Dimensional Scorecards**: Discrete ratings (1–10) across **Clarity & Structure**, **Technical Depth & Accuracy**, and **Communication Delivery**.
* **Optimal Benchmark Implementations**: Returns production-grade reference solutions (clean TypeScript, Python, or SQL) with step-by-step Big-O time and space complexity explanations.
* **1-Click Solution Copy**: Quick-clipboard integration for candidate post-interview review.

### 4. Adaptive 7-Day Curriculum & PDF Generation
* **Diagnostic Synthesis**: Aggregates recurring weaknesses identified in evaluations and maps them to a structured daily schedule.
* **Zero-Overlap PDF Engine**: Built with a custom jsPDF layout engine that dynamically calculates multi-line bounding boxes, stacks headers, and prints clean running `Page X of Y` footers with no text collision.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend Framework** | **Next.js 16.2** (Turbopack, App Router) | SSR, hybrid client rendering, and optimal route streaming |
| **UI Library** | **React 19** | Concurrent rendering, `useTransition`, and responsive state |
| **Styling & Design System** | **Tailwind CSS v4** | Dark-mode native palette, glassmorphism tokens, zero runtime CSS |
| **AI SDK** | **Google Gemini 2.5 Flash** (`@google/genai`) | High-speed structured inference, streaming SSE question delivery |
| **Database & Auth** | **Supabase (PostgreSQL + RLS)** | Row-level security, user session cookies, resume parsing |
| **Vector Engine** | **pgvector** | Cosine similarity embeddings for resume claim verification |
| **Voice & Speech** | **Web Speech API** (`SpeechRecognition` & TTS) | Hands-free live voice interview experience |
| **Document Generation** | **jsPDF** | Client-side export of 7-day preparation curricula |

---

## 🔒 Security & Data Isolation

1. **Row-Level Security (RLS)**: Every database table (`resumes`, `interview_sessions`, `interview_messages`, `skill_metrics`) enforces PostgreSQL RLS policies matching `auth.uid() = user_id`.
2. **Server-Side AI Secrets**: The `GEMINI_API_KEY` is strictly confined to server runtime environments (`lib/ai/gemini.ts` and API routes) and is never exposed in client bundles.
3. **Session Cookie Integrity**: Next.js 16 SSR cookie proxy (`proxy.ts`) authenticates protected paths (`/dashboard`, `/interview`, `/resume`, `/progress`, `/history`, `/settings`) with zero flash of unauthenticated content.

---

## 📁 Repository Structure

```
prepzo/
├── app/
│   ├── (auth)/
│   │   └── login/             # Google OAuth and email/password authentication
│   ├── (dashboard)/
│   │   ├── dashboard/         # Real-time metrics, recent sessions, and calibration
│   │   ├── history/           # Searchable archive of past questions, answers, and evals
│   │   ├── interview/         # 7-round interview arena, code editor, and scoring
│   │   │   └── live/          # Hands-free voice interview mode
│   │   ├── progress/          # ELO trajectory charts, radar breakdowns, and 7-day plan
│   │   ├── resume/            # Resume parser, skill extraction, and claim audit
│   │   ├── settings/          # Candidate profile, role calibration, and session controls
│   │   └── layout.tsx         # Unified dashboard layout with top navigation & profile
│   ├── api/                   # Server endpoints (stream-question, evaluate, improvement-plan)
│   ├── auth/                  # OAuth callback & server-side signout handlers
│   ├── globals.css            # Design tokens, custom layers, and input spacing utilities
│   ├── layout.tsx             # Root HTML layout and metadata
│   └── page.tsx               # Production landing page with session-aware navigation
├── components/                # Reusable UI primitives (buttons, cards, plan generator)
├── hooks/                     # Custom React hooks (useStreamAI, useVoice)
├── lib/
│   ├── companyData.ts         # Company hiring bars, topics, and verified question styles
│   ├── supabaseClient.ts      # Browser-side Supabase client
│   ├── supabaseServer.ts      # Server-side cookie-based Supabase client
│   └── ai/gemini.ts           # Google Gemini 2.5 Flash SDK integration
├── proxy.ts                   # Next.js 16 route protection and session proxy
└── supabase/migrations/       # Production PostgreSQL schemas, RLS policies, and vector indexes
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** 18.x or later
* **npm** 9.x or later
* A [Supabase](https://supabase.com) project with PostgreSQL
* A [Google AI Studio](https://aistudio.google.com) API Key (Gemini)

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/AdityaMani-2003/Prepzo.git
cd Prepzo

# Install dependencies
npm install
```

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build & Verification

```bash
# Run TypeScript type check
npx tsc --noEmit

# Compile production bundle with Turbopack
npm run build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
