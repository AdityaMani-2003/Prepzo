"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  Target,
  FileText,
  ChevronDown,
  Loader2,
  Award,
  BookOpen,
  Code2,
  Database,
  Cpu,
  Layers,
  UserCheck,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStreamAI } from "@/hooks/useStreamAI";
import { useVoice } from "@/hooks/useVoice";
import { parseAIContent } from "@/utils/parseAI";
import { COMPANY_DATABASE, getCompanyProfile } from "@/lib/companyData";

interface EvaluationData {
  score: number;
  score_breakdown: {
    clarity: number;
    technical: number;
    communication: number;
  };
  strengths: string[];
  weaknesses: string[];
  improved_answer: string;
  optimal_solution?: string;
  why_this_score: string;
  sessionId?: string;
}

type RoundType = "mixed" | "dsa" | "sql" | "fundamentals" | "system-design" | "resume-deepdive" | "behavioral";
type ExperienceLevel = "intern" | "junior" | "mid" | "senior";

const ROUND_TYPES: { id: RoundType; title: string; desc: string; icon: any }[] = [
  {
    id: "mixed",
    title: "Mixed Technical",
    desc: "Balanced technical round tailored to your role and target company.",
    icon: Sparkles,
  },
  {
    id: "dsa",
    title: "Coding & DSA",
    desc: "Problem solving, algorithmic efficiency, test cases, and time/space bounds.",
    icon: Code2,
  },
  {
    id: "sql",
    title: "SQL & Databases",
    desc: "Relational queries, window functions, table joins, schema design, and aggregations.",
    icon: Database,
  },
  {
    id: "fundamentals",
    title: "Core Fundamentals",
    desc: "Language internals (JS/Python/Java), frameworks, OS, networking, and OOP.",
    icon: Cpu,
  },
  {
    id: "resume-deepdive",
    title: "Resume Project Defense",
    desc: "Probing questions directly challenging your claimed resume projects and stack.",
    icon: FileText,
  },
  {
    id: "system-design",
    title: "System Design",
    desc: "High-level architecture, scalability, database choice, and fault tolerance.",
    icon: Layers,
  },
  {
    id: "behavioral",
    title: "Behavioral & HR (STAR)",
    desc: "Leadership principles, ownership, resolving conflict, and project delivery.",
    icon: UserCheck,
  },
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; badge: string }[] = [
  { id: "intern", label: "Campus / Intern", badge: "Fundamentals & Logic" },
  { id: "junior", label: "Junior (1-2 yrs)", badge: "Practical Execution" },
  { id: "mid", label: "Mid-Level (3-5 yrs)", badge: "Architecture & Trade-offs" },
  { id: "senior", label: "Senior (5+ yrs)", badge: "Scale & System Leadership" },
];

const POPULAR_COMPANIES = [
  { name: "Google", key: "google" },
  { name: "Amazon", key: "amazon" },
  { name: "Meta", key: "meta" },
  { name: "Microsoft", key: "microsoft" },
  { name: "Stripe", key: "stripe" },
  { name: "Uber", key: "uber" },
  { name: "Goldman Sachs", key: "goldman_sachs" },
  { name: "TCS / Infosys", key: "tcs_infosys" },
  { name: "Fast-Growing Startup", key: "startup" },
];

const COMMON_ROLES = [
  "Frontend Developer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Software Development Engineer (SDE)",
  "Data Engineer / Analyst",
  "DevOps & Cloud Engineer",
  "System Design",
];

function InterviewContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "";

  // Session Setup State
  const [role, setRole] = useState(initialRole || "Full Stack Engineer");
  const [targetCompany, setTargetCompany] = useState("");
  const [roundType, setRoundType] = useState<RoundType>("mixed");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("junior");

  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [questionCount, setQuestionCount] = useState(1);

  // Resume status
  const [hasResume, setHasResume] = useState<boolean | null>(null);

  // Workspace State
  const [userAnswer, setUserAnswer] = useState("");
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [showImproved, setShowImproved] = useState(false);
  const [showOptimal, setShowOptimal] = useState(true);
  const [copiedOptimal, setCopiedOptimal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Custom Hooks
  const { streamState, startStream } = useStreamAI();
  const {
    isListening,
    transcript,
    toggleListening,
    speakText,
    stopSpeaking,
    isSpeaking,
  } = useVoice();

  // Selected company profile lookup
  const companyProfile = useMemo(() => {
    return getCompanyProfile(targetCompany);
  }, [targetCompany]);

  // Check resume existence on mount
  useEffect(() => {
    fetch("/api/resume")
      .then((res) => res.json())
      .then((data) => {
        setHasResume(!!data.resume);
      })
      .catch(() => setHasResume(false));
  }, []);

  // Sync speech-to-text transcript into user answer
  useEffect(() => {
    if (isListening && transcript) {
      setUserAnswer(transcript);
    }
  }, [transcript, isListening]);

  // Session timer
  useEffect(() => {
    let interval: any;
    if (sessionStarted && !evaluation) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted, evaluation]);

  // Auto-switch to code mode if DSA or SQL is chosen
  useEffect(() => {
    if (roundType === "dsa" || roundType === "sql") {
      setIsCodeMode(true);
    }
  }, [roundType]);

  const handleStartInterview = async () => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setSessionStarted(true);
    setEvaluation(null);
    setUserAnswer("");
    setTimerSeconds(0);
    setQuestionCount(1);

    await startStream(role, targetCompany, roundType, experienceLevel);
  };

  const handleSpeakQuestion = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (streamState.text) {
      speakText(streamState.text);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    if (isListening) {
      toggleListening();
    }
    stopSpeaking();

    setIsEvaluating(true);
    setEvalError(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: streamState.text,
          answer: userAnswer.trim(),
          topic: `${role} - ${roundType.toUpperCase()}`,
          sessionId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to evaluate answer.");
      }

      const data = await res.json();
      setEvaluation(data);
    } catch (err: any) {
      setEvalError(err?.message || "Evaluation encountered an issue.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = async () => {
    setEvaluation(null);
    setUserAnswer("");
    setTimerSeconds(0);
    setQuestionCount((c) => c + 1);
    await startStream(role, targetCompany, roundType, experienceLevel);
  };

  const copyOptimalSolution = () => {
    if (evaluation?.optimal_solution) {
      navigator.clipboard.writeText(evaluation.optimal_solution);
      setCopiedOptimal(true);
      setTimeout(() => setCopiedOptimal(false), 2000);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* ────────────────── SETUP SCREEN ────────────────── */}
      {!sessionStarted && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Header */}
          <div className="border-b border-[var(--border-subtle)] pb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
              <Target className="h-4 w-4" />
              Tailored Candidate Preparation
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              AI Mock Interview Setup
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Configure your specific interview round, target company hiring bar, and experience tier for realistic, student-focused practice.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 sm:p-7 shadow-sm space-y-7">
            {/* 1. Interview Round Type (DSA, SQL, Fundamentals, etc.) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Select Interview Round
                </label>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Practical questions with schemas & test cases
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {ROUND_TYPES.map((rt) => {
                  const Icon = rt.icon;
                  const isSelected = roundType === rt.id;
                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => setRoundType(rt.id)}
                      className={`rounded-xl border p-3.5 text-left transition-all flex flex-col justify-between group ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent-subtle)] shadow-sm"
                          : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className={`rounded-lg p-1.5 ${
                            isSelected
                              ? "bg-[var(--accent)] text-white"
                              : "bg-[var(--bg-card)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            isSelected ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                          }`}
                        >
                          {rt.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        {rt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Target Company (With Search Bar bug fixed & Presets) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Target Company
                </label>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Calibrates interview question style & rubric
                </span>
              </div>

              {/* Input with icon - FIX APPLIED: input-icon-left ensures text never collides with icon! */}
              <div className="relative mb-3">
                <Building className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g. Google, Amazon, Stripe, TCS, Goldman Sachs, or type your company..."
                  className="input-icon-left"
                />
              </div>

              {/* Company Quick-Select Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-muted)] mr-1">Popular:</span>
                {POPULAR_COMPANIES.map((comp) => {
                  const isActive = targetCompany.toLowerCase().includes(comp.key.toLowerCase());
                  return (
                    <button
                      key={comp.key}
                      type="button"
                      onClick={() => setTargetCompany(comp.name)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                        isActive
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      {comp.name}
                    </button>
                  );
                })}
              </div>

              {/* Company Profile Card if recognized */}
              {companyProfile && (
                <div className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-950/15 p-3.5 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-indigo-400">
                      {companyProfile.name} Hiring Standards
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {companyProfile.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {companyProfile.interviewFocus}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {companyProfile.keyTopics.map((topic, i) => (
                      <span
                        key={i}
                        className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300 font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Candidate Experience / Seniority Tier */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                Candidate Seniority / Experience Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EXPERIENCE_LEVELS.map((lvl) => {
                  const isSelected = experienceLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setExperienceLevel(lvl.id)}
                      className={`rounded-xl border p-2.5 text-center transition-all ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold"
                          : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className="text-xs font-semibold">{lvl.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{lvl.badge}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Target Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                Engineering Role
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      role === r
                        ? "bg-[var(--accent-subtle)] border border-[var(--accent)] text-[var(--accent)] font-semibold"
                        : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Resume Status Banner */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Resume-Grounded Questions
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {hasResume
                      ? "Your uploaded resume will be semantically referenced to challenge your claims and tailor the difficulty."
                      : "No resume detected. Upload one to practice answering questions about your real projects."}
                  </p>
                </div>
              </div>

              {!hasResume && (
                <Link href="/resume">
                  <Button variant="outline" className="h-8 text-xs shrink-0">
                    Upload Resume
                  </Button>
                </Link>
              )}
            </div>

            {/* Launch CTA */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                variant="primary"
                onClick={handleStartInterview}
                className="h-11 px-8 text-sm font-semibold shadow-[var(--shadow-glow)]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start Interview Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── ACTIVE INTERVIEW WORKSPACE ────────────────── */}
      {sessionStarted && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-[var(--accent-subtle)] border border-[var(--border-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                Q#{questionCount}
              </span>
              <span className="rounded-md bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {ROUND_TYPES.find((rt) => rt.id === roundType)?.title || "Technical Round"}
              </span>
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {role}
              </span>
              {targetCompany && (
                <span className="text-xs text-[var(--text-muted)]">
                  • {targetCompany}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                <Clock className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>{formatTimer(timerSeconds)}</span>
              </div>

              <Link href="/progress">
                <Button variant="outline" className="h-8 text-xs">
                  End Session
                </Button>
              </Link>
            </div>
          </div>

          {/* AI Question Card */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                <Sparkles className="h-4 w-4" />
                Interviewer Question
              </div>

              <button
                type="button"
                onClick={handleSpeakQuestion}
                disabled={streamState.isStreaming || !streamState.text}
                className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
                title={isSpeaking ? "Stop Speaking" : "Listen to question"}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="h-4 w-4 text-[var(--accent)]" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            </div>

            {/* Question Text Rendering */}
            <div className="min-h-[100px] text-base leading-relaxed text-[var(--text-primary)]">
              {streamState.isStreaming && !streamState.text && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
                  Generating realistic question calibrated to {targetCompany || "industry standards"}...
                </div>
              )}

              {streamState.text && (
                <div
                  className="prose prose-invert max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: parseAIContent(streamState.text),
                  }}
                />
              )}

              {streamState.error && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--red-subtle)] border border-red-500/20 text-xs text-[var(--red)] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{streamState.error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Answer Composer (When not evaluated yet) */}
          {!evaluation && (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Your Response
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCodeMode(!isCodeMode)}
                    className={`rounded px-2 py-0.5 text-[11px] font-mono transition-all ${
                      isCodeMode
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {isCodeMode ? "Code Editor Mode" : "Plain Text Mode"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      isListening
                        ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                        : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-3.5 w-3.5" />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5" />
                        Voice Dictation
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isEvaluating}
                placeholder={
                  isCodeMode
                    ? "// Write your solution code, algorithm, or SQL query here...\n// Include your approach and time/space complexity notes."
                    : "Formulate your response here. Walk through your thought process, clarify edge cases, and justify your design choices. Or use the mic to answer verbally..."
                }
                rows={9}
                className={`w-full resize-none leading-relaxed ${
                  isCodeMode ? "font-mono text-xs bg-[#0b0f19] text-emerald-300" : "font-sans text-sm"
                }`}
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-[var(--text-muted)]">
                  {userAnswer.trim().split(/\s+/).filter(Boolean).length} words • {userAnswer.length} chars
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleNextQuestion}
                    disabled={isEvaluating || streamState.isStreaming}
                    className="h-10 px-4 text-xs w-full sm:w-auto"
                  >
                    Skip Question
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleSubmitAnswer}
                    loading={isEvaluating}
                    disabled={!userAnswer.trim() || streamState.isStreaming}
                    className="h-10 px-6 text-sm font-semibold w-full sm:w-auto shadow-[var(--shadow-glow)]"
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    Submit Answer
                  </Button>
                </div>
              </div>

              {evalError && (
                <div className="p-3 rounded-lg bg-[var(--red-subtle)] border border-red-500/20 text-xs text-[var(--red)] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{evalError}</span>
                </div>
              )}
            </div>
          )}

          {/* ────────────────── EVALUATION RESULT CARD ────────────────── */}
          {evaluation && (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 sm:p-7 shadow-[var(--shadow-elevated)] space-y-6 animate-fadeInUp">
              {/* Score Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    Feedback & Learning Breakdown
                  </span>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
                    Answer Evaluation
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 text-center">
                    <span className="text-2xl font-black text-indigo-400">
                      {evaluation.score}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-medium"> / 10</span>
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">
                      Overall Score
                    </p>
                  </div>
                </div>
              </div>

              {/* Score Dimension Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5">
                  <div className="text-xs text-[var(--text-muted)] font-medium uppercase">
                    Clarity & Structure
                  </div>
                  <div className="text-lg font-bold text-[var(--text-primary)] mt-1">
                    {evaluation.score_breakdown.clarity} <span className="text-xs text-[var(--text-muted)]">/ 10</span>
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5">
                  <div className="text-xs text-[var(--text-muted)] font-medium uppercase">
                    Technical Depth
                  </div>
                  <div className="text-lg font-bold text-[var(--text-primary)] mt-1">
                    {evaluation.score_breakdown.technical} <span className="text-xs text-[var(--text-muted)]">/ 10</span>
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5">
                  <div className="text-xs text-[var(--text-muted)] font-medium uppercase">
                    Communication & Rationale
                  </div>
                  <div className="text-lg font-bold text-[var(--text-primary)] mt-1">
                    {evaluation.score_breakdown.communication} <span className="text-xs text-[var(--text-muted)]">/ 10</span>
                  </div>
                </div>
              </div>

              {/* Why This Score */}
              {evaluation.why_this_score && (
                <div className="text-sm text-[var(--text-secondary)] leading-relaxed italic border-l-2 border-[var(--accent)] pl-4">
                  &ldquo;{evaluation.why_this_score}&rdquo;
                </div>
              )}

              {/* Strengths & Weaknesses 2-Col */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Key Strengths
                  </div>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-[var(--text-primary)] flex items-start gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5">
                    <AlertCircle className="h-4 w-4" />
                    Exact Areas to Tighten
                  </div>
                  <ul className="space-y-2">
                    {evaluation.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-[var(--text-primary)] flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Optimal Solution / Reference Implementation */}
              {evaluation.optimal_solution && (
                <div className="rounded-xl border border-indigo-500/30 bg-[#0c0f1d] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      Optimal Benchmark Solution & Complexity
                    </span>
                    <button
                      type="button"
                      onClick={copyOptimalSolution}
                      className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      {copiedOptimal ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedOptimal ? "Copied" : "Copy Solution"}</span>
                    </button>
                  </div>

                  <div className="rounded-lg bg-black/40 border border-white/5 p-4 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {evaluation.optimal_solution}
                  </div>
                </div>
              )}

              {/* Expandable Model / Improved Answer */}
              {evaluation.improved_answer && (
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <button
                    type="button"
                    onClick={() => setShowImproved(!showImproved)}
                    className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                      View High-Scoring Verbal Script
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        showImproved ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showImproved && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-line animate-fadeIn">
                      {evaluation.improved_answer}
                    </div>
                  )}
                </div>
              )}

              {/* Next Steps CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    else speakText(evaluation.why_this_score || "Good technical response.");
                  }}
                  className="h-10 text-xs w-full sm:w-auto"
                >
                  <Volume2 className="h-4 w-4 mr-1" />
                  {isSpeaking ? "Mute Feedback" : "Dictate Feedback"}
                </Button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    onClick={handleNextQuestion}
                    className="h-10 px-6 text-sm font-semibold w-full sm:w-auto shadow-[var(--shadow-glow)]"
                  >
                    Next Question
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-[var(--text-muted)]">Loading Interview Engine...</div>}>
      <InterviewContent />
    </Suspense>
  );
}
