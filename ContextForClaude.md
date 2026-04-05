# Prepzo: AI Interview Preparation SaaS
## Project Overview
Prepzo is a Next.js 16-based SaaS platform designed to act as an AI-powered interview coach. It dynamically parses user resumes, generates contextual interview questions (using Google's Gemini AI), evaluates candidate answers on technical and clarity metrics, and tracks their performance via an ELO rating system.

The project has transitioned from prototype to a stable core, strictly enforcing robust "Fail-Open to UI" patterns and heavily utilizing native Server Components combined with Supabase for data and authentication.

## Tech Stack & Architecture
- **Framework:** Next.js 16.2.2 (App Router with Turbopack)
- **Authentication & Database:** Supabase SSR (with `@supabase/ssr` cookies strategy and `lib/supabaseServer.ts` / `lib/supabaseClient.ts` singletons).
- **Styling:** Tailwind CSS (configured for advanced utility classes).
- **Icons:** `lucide-react`.
- **AI Engine:** `@google/genai` (Google Gemini 2.5 Flash, robust streaming and evaluation endpoints).

## Key Directory Structure
- `app/(auth)/login/page.tsx`: Standard OAuth / Google Sign-In portal.
- `app/(dashboard)/layout.tsx`: Client-wrapper layout containing sidebar navigation.
- `app/(dashboard)/dashboard/page.tsx`: Server Component that aggregates analytics (ELO score, active resume tracking, strengths/weaknesses summary).
- `app/(dashboard)/interview/page.tsx`: The primary mock interview workspace featuring both streaming text-based AI chat and Web Speech API abstractions (`hooks/useVoice`).
- `proxy.ts`: Advanced Route Middleware. In Next.js 16.2.2, `middleware.ts` is explicitly deprecated in favor of `proxy.ts`.

## Core Design & UI/UX Principles
The UI adheres strictly to top-tier, premium FAANG-level SaaS standards:
1. **Dark Mode First:** Core background is `#0B0F19`, with secondary module cards using `#111827` or `#080C14`.
2. **Glassmorphism & Gradients:** Heavy reliance on translucent borders (`border-white/[0.06]`) and subtle colored background layers (`bg-indigo-500/[0.07]`) to create depth.
3. **Micro-interactions:** Buttons and cards feature smooth transitons (`transition-all duration-200 hover:border-indigo-500/25 hover:shadow-lg group-hover:bg-indigo-500/20`). Do NOT use generic flat colors.

## Important Backend Patterns & Gotchas
- **Next.js 16.2.2 Breaking Changes:** Keep routing interception logic specifically inside `proxy.ts` (`export async function proxy(request) { ... }`). Do not revert to `middleware`.
- **Supabase `.single()` Queries:** When querying tables where 0 rows is an acceptable baseline (e.g. looking up a user's resume when they haven't uploaded one), **always** use `.maybeSingle()` instead of `.single()`. Using `.single()` will throw an unhandled `PGRST116` error and fatally crash the React Suspense boundary.
- **Server Component Rendering:** To avoid hard crashes on the Next.js side during hot-reloads, avoid redeclaring block-scoped variables across disjointed `try/catch` blocks in Server Components.

## Expansion Roadmap (Target Feature Builds)
The primary features to be implemented next include:
1. **The "Live" Audio Intelligence Module (`/interview/live`):** Connect browser `MediaRecorder` or Web Speech APIs to a seamless streaming interface for a voice-only mockup experience.
2. **FAANG "Calibrator" Dashboard (`/progress`):** Implement `recharts` to visualize the historical ELO trajectory and breakdown of clarity vs. technical capabilities extracted from `interview_messages`. 
3. **Vector Semantic Memory (pgvector):** Expand the backend PDF parser so that Supabase can contextually reference specific paragraphs of the user's resume via Retrieval-Augmented Generation (RAG) during mock interviews.
