import Link from "next/link";
import {
  ArrowRight,
  Target,
  Sparkles,
  CheckCircle2,
  FileText,
  Mic,
  Shield,
  Award,
  Zap,
  HelpCircle,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabaseServer";

export const metadata = {
  title: "Prepzo — Production-Grade AI Technical Interview Coach",
  description:
    "Master technical interviews with resume-grounded questions, real-time AI evaluation, ELO progression tracking, and personalized 7-day curricula.",
};

export default async function Home() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {}

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] overflow-x-hidden selection:bg-[var(--accent-subtle)]">
      {/* ────────────────── NAVBAR ────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] transition-transform group-hover:scale-105">
              <Target className="h-4.5 w-4.5 text-[var(--accent)]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Prepzo
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-[var(--text-primary)] transition-colors">
              How It Works
            </a>
            <a href="#technology" className="hover:text-[var(--text-primary)] transition-colors">
              Architecture
            </a>
            <a href="#faq" className="hover:text-[var(--text-primary)] transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/settings">
                  <Button variant="ghost" className="text-xs h-9 px-3 gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white shrink-0">
                      {userInitial}
                    </div>
                    <span>Profile</span>
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="primary" className="text-xs h-9 px-4 shadow-[var(--shadow-glow)]">
                    Dashboard
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
                <Link href="/auth/signout">
                  <Button variant="outline" className="text-xs h-9 px-3 text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/30">
                    Sign Out
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-xs h-9 px-3">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="primary" className="text-xs h-9 px-4 shadow-[var(--shadow-glow)]">
                    Start Practicing
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ────────────────── HERO SECTION ────────────────── */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 900px 500px at 50% -50px, rgba(124,58,237,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--accent-subtle)] px-4 py-1.5 text-xs font-semibold text-[var(--accent)] mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Google Gemini 2.5 Flash & pgvector RAG
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl">
            Crack Technical Interviews with{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #c084fc, #9333ea, #6366f1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Resume-Grounded AI
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Practice realistic, FAANG-caliber interview questions calibrated against your actual project claims. Get objective scoring, ELO progression, and targeted 7-day study plans.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link href={user ? "/interview" : "/login"} className="w-full sm:w-auto">
              <Button
                variant="primary"
                className="h-12 px-8 text-sm font-semibold w-full sm:w-auto shadow-[var(--shadow-glow)]"
              >
                {user ? "Enter Interview Arena" : "Launch Mock Interview"}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            {user ? (
              <Link href="/settings" className="w-full sm:w-auto">
                <Button variant="outline" className="h-12 px-6 text-sm font-semibold w-full sm:w-auto">
                  Candidate Profile
                </Button>
              </Link>
            ) : (
              <a href="#features" className="w-full sm:w-auto">
                <Button variant="outline" className="h-12 px-6 text-sm font-semibold w-full sm:w-auto">
                  Explore Core Engine
                </Button>
              </a>
            )}
          </div>

          {/* Feature Highlights Pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)] font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              <span>pgvector Cosine Verification</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[var(--border-strong)] hidden sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              <span>Real-Time SSE Streaming</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[var(--border-strong)] hidden sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              <span>Native Voice Dictation & TTS</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[var(--border-strong)] hidden sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              <span>Calculated ELO Rating</span>
            </div>
          </div>
        </div>

        {/* ────────────────── PRODUCT PREVIEW MOCKUP ────────────────── */}
        <div className="relative z-10 max-w-5xl mx-auto mt-16 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-[var(--shadow-elevated)] backdrop-blur-sm">
          {/* Mock Window Controls */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              prepzo.workspace / session-active
            </span>
            <div className="h-3 w-12" />
          </div>

          {/* Mock Interview Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="md:col-span-2 space-y-4">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Senior Frontend Question • System Design
                </span>
                <p className="text-sm font-semibold text-[var(--text-primary)] mt-1.5">
                  &ldquo;Design a client-side telemetry buffer in Next.js that batches performance events, guarantees zero data loss during page unload, and respects low-bandwidth network constraints.&rdquo;
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Candidate Response (Voice-Dictated)
                </span>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  &ldquo;I would use IndexedDB as an offline persistent queue, batching payloads with requestIdleCallback. For page unloads, navigator.sendBeacon guarantees non-blocking delivery even after the document teardown...&rdquo;
                </p>
              </div>
            </div>

            {/* Mock Evaluation */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Instant AI Evaluation
                  </span>
                  <span className="text-sm font-black text-indigo-300">8.7 / 10</span>
                </div>
                <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between">
                    <span>Clarity</span>
                    <span className="font-semibold text-[var(--text-primary)]">9 / 10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Technical Depth</span>
                    <span className="font-semibold text-[var(--text-primary)]">8.5 / 10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Communication</span>
                    <span className="font-semibold text-[var(--text-primary)]">8.6 / 10</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-500/10 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>+7.4 ELO change recorded</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── CAPABILITIES SECTION ────────────────── */}
      <section id="features" className="py-20 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
              Engine Capabilities
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Engineered for High-Stakes Technical Preparation
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Unlike generic chatbot prompts, Prepzo uses domain-specific calibration and persistent memory vectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 space-y-4">
              <div className="rounded-xl bg-[var(--accent-subtle)] p-3 text-[var(--accent)] w-fit">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                Resume RAG Fact-Checking
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Your resume text is chunked and vectorized using Google&apos;s 768-dimensional text-embedding-004. During evaluation, your answers are cross-referenced with your claimed projects to challenge gaps and inconsistencies.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 space-y-4">
              <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400 w-fit">
                <Mic className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                Hands-Free Voice Interaction
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Practice answering verbally with browser-native Web Speech recognition. Automatic silence detection and error recovery simulate the pressure of an actual video conference interview.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 space-y-4">
              <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400 w-fit">
                <Award className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                Dynamic ELO Skill Rating
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Starting at a standard 1200 rating, every evaluated response shifts your ELO score based on dimensional performance (Clarity, Technical Depth, Communication), giving you an objective measure of readiness.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 space-y-4">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400 w-fit">
                <Target className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                Personalized 7-Day Curriculum
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Prepzo analyzes recurring weaknesses across all sessions to compile a tailored 7-day study plan, complete with daily focus areas, time-boxed exercises, and printable PDF export.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 space-y-4">
              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400 w-fit">
                <Zap className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                SSE Streaming Questions
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Questions stream token-by-token via Server-Sent Events, eliminating perceived latency and presenting complex scenarios naturally as the interviewer speaks.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 space-y-4">
              <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400 w-fit">
                <Shield className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                Strict Privacy & Row-Level Security
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                All resumes, vector embeddings, and session logs are isolated per user via Supabase PostgreSQL Row Level Security (RLS) policies. Your sensitive candidate data is never shared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── WORKFLOW SECTION ────────────────── */}
      <section id="workflow" className="py-20 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
              The Workflow
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              From Resume Upload to Offer-Ready
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Three streamlined steps to eliminate interview anxiety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-base font-bold text-[var(--accent)]">
                1
              </div>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                Upload & Calibrate
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Provide your resume and select your target role (Frontend, Backend, System Design) and company caliber.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-base font-bold text-[var(--accent)]">
                2
              </div>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                Execute Realistic Sessions
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Answer streaming technical questions verbally or in writing. Receive immediate feedback breakdowns and follow-up challenges.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-base font-bold text-[var(--accent)]">
                3
              </div>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                Review & Elevate
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Inspect your ELO trajectory, study your personalized 7-day curriculum, and practice weak areas until mastery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── ARCHITECTURE SECTION ────────────────── */}
      <section id="technology" className="py-20 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
            Technical Architecture
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
            Modern, Resilient Full-Stack Foundation
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Framework</span>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">Next.js 16 + React 19</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">App Router, SSR, Turbopack</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">AI Inference</span>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">Gemini 2.5 Flash</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">High-speed reasoning & Vision OCR</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Vector Database</span>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">Supabase pgvector</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">HNSW cosine proximity RAG</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Design & Charts</span>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">Tailwind v4 + Recharts</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">Custom tokens & dark/light theme</p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── FAQ SECTION ────────────────── */}
      <section id="faq" className="py-20 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
              Frequently Asked Questions
            </h2>
            <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Everything You Need to Know
            </h3>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does the AI evaluate my answers?",
                a: "Answers are analyzed across three core dimensions: Clarity, Technical Depth, and Communication Structure. The evaluator provides numerical breakdowns, specific strengths, actionable areas for improvement, and a model benchmark response.",
              },
              {
                q: "What is the ELO rating system?",
                a: "Borrowing from competitive rating algorithms, your ELO starts at a baseline of 1200. Each answer shifts your rating up or down based on your score relative to expected standards, providing an objective metric of readiness.",
              },
              {
                q: "How does Prepzo use my resume?",
                a: "Your resume text is vectorized using Google's text-embedding-004 model. When evaluating answers, the AI retrieves relevant background context from your resume to verify that your responses match your historical project experience.",
              },
              {
                q: "Can I practice with voice only?",
                a: "Yes. Prepzo includes both in-browser speech recognition for dictating your responses and text-to-speech audio dictation for hearing questions and evaluations out loud.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 space-y-2"
              >
                <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[var(--accent)] shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── BOTTOM CTA ────────────────── */}
      <section className="py-20 px-6 border-t border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-app)] to-[var(--bg-surface)] text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Experience realistic technical interviews with instant feedback and structured curriculum planning.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="primary" className="h-12 px-8 text-sm font-semibold shadow-[var(--shadow-glow)]">
                Get Started with Prepzo
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-10 px-6 text-xs text-[var(--text-muted)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[var(--accent)]" />
            <span className="font-bold text-[var(--text-primary)]">Prepzo</span>
            <span>— AI Technical Interview Preparation</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
              Dashboard
            </Link>
            <a
              href="https://github.com/AdityaMani-2003/Prepzo"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              GitHub
            </a>
          </div>

          <div>© {new Date().getFullYear()} Prepzo. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
