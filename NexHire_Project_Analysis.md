# NexHire SaaS: Project State & Strategic Audit
**Target Audience**: ChatGPT (Acting as Product Manager prompt engineer)

This document provides a comprehensive technical breakdown of the `NexHire` repository in its current state. Your goal (as ChatGPT) is to use this document to formulate precise, step-by-step development prompts that the Antigravity engineering AI can execute to elevate this into a tier-1, FAANG-level SaaS product.

---

## 1. Current Implementation Status
The project has successfully transitioned from a prototype to a stable, production-hardened core. 

### Architecture & Backend
* **Framework:** Next.js 14+ (App Router).
* **Database & Auth:** Supabase. We implemented a singleton client (`lib/supabaseClient.ts`) to fix persistent 'auth-token lock stolen' exceptions caused by React lifecycle mount duplication.
* **AI Engine:** Google Gemini SDK (`@google/genai`). Swapped from `gemini-2.0-flash` (heavily rate-limited on free tiers) to `gemini-2.5-flash` with aggressive, native rate-limit retry logic (parsing Google's `retryDelay` headers).
* **API Resilience:** We strictly implemented a "Fail-Open to UI" pattern. Instead of the API mimicking successful generic JSON on failure, it now throws hard HTTP 500/403/429 errors which the React UI natively intercepts to render sleek warning boundaries (preventing silent phantom errors).

### Frontend & UI/UX
* **Aesthetic Standard:** Strict premium dark-mode SaaS styling. Heavy utilization of `#0a0a0a` cards on `#000000` backgrounds, glassmorphism borders (`border-gray-800`, `hover:border-white/20`), and `lucide-react` icons.
* **Resume Processing:** Client-side PDF ingestion using `pdfjs-dist` to dynamically parse raw ATS text into memory without saturating server-side binary payloads.
* **Component Lifecycle:** Strict concurrency control in `useEffect` hooks utilizing `mounted` booleans to prevent memory leaks and duplicate Supabase network calls during rapid DOM repaints.

---

## 2. Identified Vulnerabilities & Technical Debt
*Please generate prompts to address these structural issues before scaling.*

1. **Database Row Level Security (RLS)**: While Supabase Auth is active, we need to explicitly audit the PostgreSQL RLS policies in the `resumes` and `interviews` tables to ensure multi-tenant security guarantees. 
2. **Synchronous AI Wait Times (TTFB)**: Both `/api/question` and `/api/evaluate` use blocking `await callGemini()` REST calls. On large context windows, the user stares at a loading spinner. This needs to be refactored into **Server-Sent Events (SSE)** or React Server Components stream UI to stream the text chunk-by-chunk.
3. **Fragile Client-Side PDF Parsing**: `pdfjs-dist` run via the browser can occasionally crash on highly stylized multi-layered PDFs. It lacks OCR for image-based PDFs. (A robust backend fallback is required).
4. **Middleware Deprecation**: The Next.js terminal logs throw `WARN: The "middleware" file convention is deprecated. Please use "proxy" instead.` 

---

## 3. FAANG/Startup Expansion Roadmap (Feature Proposals)
*Please generate ambitious pipeline prompts to build these out.*

### Phase 1: Real-time Audio Intelligence (The "Live" Module)
*   **Goal:** Build out the scaffolded `/interview/live` route.
*   **Tech:** Integrate the browser's native `MediaRecorder` API (or Deepgram/Whisper APIs) for Speech-to-Text. Stream the transcript via WebSocket to a backend that evaluates the candidate in real-time, delivering pushbacks and follow-up interrogations via TTS (ElevenLabs API).

### Phase 2: Vector Semantic Memory (Contextual Interviews)
*   **Goal:** Right now, follow-up questions are strictly based on single-turn context.
*   **Tech:** Spin up `pgvector` inside the existing Supabase instance. When a resume is analyzed, embed the text into vectors. As the interview progresses, RAG (Retrieval-Augmented Generation) queries the resume to challenge the user dynamically (e.g., *"You mentioned Kubernetes earlier, but this answer sounds like a monolithic approach. Can you clarify?"*)

### Phase 3: The FAANG "Calibrator" Dashboard
*   **Goal:** Build out `/progress`.
*   **Tech:** Formulate an ELO-rating simulation based on historical interview sessions. Generate visual scatter-plots using `recharts` showing a candidate's localized strengths (e.g., High System Design, Low React internals) mapped against industry standards.

---

## Instructions for ChatGPT
Analyze this document. Your output should be a sequence of 3-4 highly specific, scoped "Prompt Directives" directed at Antigravity. 

Example ChatGPT output to User:
> *"Here is your first prompt to feed to Antigravity: 'Antigravity, please execute Phase 1: convert the `callGemini` service in `services/ai.service.ts` into a streaming response utilizing the Next.js AI SDK `streamText` function...'"*
