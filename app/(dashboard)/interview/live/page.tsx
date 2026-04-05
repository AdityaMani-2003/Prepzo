"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Mic, Loader2, Target, CheckCircle, AlertCircle, Clock, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EvaluationResult {
  score_breakdown: {
    clarity: number;
    technical: number;
    communication: number;
  };
  strengths: string[];
  weaknesses: string[];
  improved_answer: string;
  why_this_score: string;
}

const TOTAL_QUESTIONS = 5;
const SECONDS_PER_QUESTION = 180; // 3 minutes

export default function LiveInterviewPage() {
  const [role, setRole] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questionCount, setQuestionCount] = useState(0);
  const [questionData, setQuestionData] = useState<{
    question: string;
    difficulty: string;
    topic: string;
  } | null>(null);
  const [answer, setAnswer] = useState("");
  const [sessionResults, setSessionResults] = useState<EvaluationResult[]>([]);

  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const isSubmitting = useRef(false);

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLive && !isCompleted && !loading && questionData) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto submit when time runs out
            if (!isSubmitting.current) {
              handleAutoSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLive, isCompleted, loading, questionData]);

  const handleAutoSubmit = () => {
    const submitBtn = document.getElementById("submit-answer-btn");
    if (submitBtn) {
      submitBtn.click();
    }
  };

  const fetchNextQuestion = async (currentRole: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: currentRole }),
      });

      if (!res.ok) throw new Error("Failed to generate next question.");

      const data = await res.json();
      setQuestionData(data);
      setAnswer("");
      setTimeLeft(SECONDS_PER_QUESTION);
      setQuestionCount((c) => c + 1);
    } catch (err: any) {
      setError(err.message || "Failed to load question.");
      setIsLive(false); // abort session safely
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!role.trim()) return;
    setIsLive(true);
    await fetchNextQuestion(role);
  };

  const submitAnswer = async () => {
    if (!questionData || isSubmitting.current) return;
    
    isSubmitting.current = true;
    setLoading(true);
    setError(null);

    // Save final answer state to send
    const finalAnswer = answer.trim() || "No answer provided.";

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionData.question, answer: finalAnswer, topic: questionData.topic }),
      });

      if (!res.ok) throw new Error("Failed to evaluate answer.");

      const resultData = await res.json();
      setSessionResults((prev) => [...prev, resultData]);

      if (questionCount >= TOTAL_QUESTIONS) {
        setIsCompleted(true);
      } else {
        await fetchNextQuestion(role);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred submitting your answer.");
    } finally {
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  // Derived final scorecard statistics
  const finalStats = useMemo(() => {
    if (sessionResults.length === 0) return null;

    let totalClarity = 0;
    let totalTechnical = 0;
    let totalCommunication = 0;
    const strengths = new Set<string>();
    const weaknesses = new Set<string>();

    sessionResults.forEach((res) => {
      totalClarity += res.score_breakdown.clarity;
      totalTechnical += res.score_breakdown.technical;
      totalCommunication += res.score_breakdown.communication || (res.score_breakdown as any).structure || 0;
      
      res.strengths.forEach(s => strengths.add(s));
      res.weaknesses.forEach(w => weaknesses.add(w));
    });

    const count = sessionResults.length;
    const avgClarity = Math.round(totalClarity / count);
    const avgTechnical = Math.round(totalTechnical / count);
    const avgComm = Math.round(totalCommunication / count);
    const avgOverall = Math.round((avgClarity + avgTechnical + avgComm) / 3);

    return {
      avgClarity,
      avgTechnical,
      avgComm,
      avgOverall,
      strengths: Array.from(strengths).slice(0, 5), // top 5
      weaknesses: Array.from(weaknesses).slice(0, 5) // top 5
    };
  }, [sessionResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isCompleted && finalStats) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 animate-fadeInUp">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-2xl bg-emerald-500/10 p-4">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Live Session Complete</h1>
          <p className="mt-2 text-lg text-gray-400">You completed the {TOTAL_QUESTIONS}-question marathon for {role}.</p>
        </div>

        <Card>
          <h2 className="mb-6 text-xl font-semibold text-white text-center">Final Scorecard</h2>
          
          <div className="mb-8 grid gap-4 sm:grid-cols-4 text-center">
            <div className="rounded-xl bg-[#0B0F19] border border-white/[0.06] p-4">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Overall Score</div>
              <div className="mt-1 text-3xl font-bold text-emerald-400">{finalStats.avgOverall}/10</div>
            </div>
            <div className="rounded-xl bg-[#0B0F19] border border-white/[0.06] p-4">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Avg Clarity</div>
              <div className="mt-1 text-2xl font-bold text-white">{finalStats.avgClarity}/10</div>
            </div>
            <div className="rounded-xl bg-[#0B0F19] border border-white/[0.06] p-4">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Avg Technical</div>
              <div className="mt-1 text-2xl font-bold text-white">{finalStats.avgTechnical}/10</div>
            </div>
            <div className="rounded-xl bg-[#0B0F19] border border-white/[0.06] p-4">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Avg Communication</div>
              <div className="mt-1 text-2xl font-bold text-white">{finalStats.avgComm}/10</div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <h3 className="mb-4 text-lg font-medium text-emerald-400">Key Strengths Demonstrated</h3>
              <ul className="space-y-3">
                {finalStats.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-100/80">
                    <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {str}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
              <h3 className="mb-4 text-lg font-medium text-amber-400">Areas to Improve</h3>
              <ul className="space-y-3">
                {finalStats.weaknesses.map((weak, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-100/80">
                    <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {weak}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
             <Button
                onClick={() => window.location.reload()}
                className="bg-white text-black hover:bg-gray-200"
              >
                Start New Session
              </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Live Exam View
  if (isLive) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-fadeInUp">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[13px] font-medium text-indigo-300">
            Question {questionCount} of {TOTAL_QUESTIONS}
          </div>
          
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-bold tracking-widest ${
            timeLeft < 30 ? "bg-red-500/15 text-red-400 timer-warning" : timeLeft < 60 ? "bg-orange-500/10 text-orange-400" : "bg-[#111827] text-white"
          }`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {loading && !questionData ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-purple-400" />
            <p>Preparing next question...</p>
          </div>
        ) : questionData && (
          <Card className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-gray-400">
                <Target className="h-3.5 w-3.5" />
                {questionData.topic} • {questionData.difficulty}
              </div>
              <h2 className="text-xl font-medium leading-relaxed text-white">
                {questionData.question}
              </h2>
            </div>

            <div className="space-y-4">
              <label htmlFor="answer" className="block text-sm font-medium text-gray-300">
                Your Answer <span className="text-gray-500 font-normal ml-2">({loading ? "Locked" : "Live"})</span>
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={loading}
                placeholder="Type your answer here..."
                rows={6}
                className="input-glow w-full resize-none rounded-xl border border-white/[0.08] bg-[#0B0F19] p-4 text-[13px] text-white placeholder-gray-600 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-end">
                <Button
                  id="submit-answer-btn"
                  onClick={submitAnswer}
                  disabled={loading}
                  loading={loading}
                  className="px-8 bg-purple-600 hover:bg-purple-500"
                >
                  Submit Answer
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Initial Setup View
  return (
    <div className="mx-auto max-w-xl text-center pt-12 animate-fadeInUp">
      <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
        <Mic className="h-8 w-8 text-indigo-400" />
      </div>
      <h1 className="mb-3 text-2xl font-bold text-white tracking-tight">Live Interview</h1>
      <p className="mb-8 text-[14px] text-gray-400 leading-relaxed max-w-md mx-auto">
        Face <strong className="text-white">{TOTAL_QUESTIONS} timed questions</strong> for your target role. You have <strong className="text-white">{formatTime(SECONDS_PER_QUESTION)}</strong> per question before auto-submit.
      </p>

      <Card className="text-left">
        <label htmlFor="role-setup" className="mb-2 block text-[13px] font-medium text-gray-400">
          What role are you preparing for?
        </label>
        <input
          id="role-setup"
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Senior Machine Learning Engineer"
          className="input-glow w-full rounded-lg border border-white/[0.08] bg-[#0B0F19] px-4 py-2.5 text-[13px] text-white placeholder-gray-600 outline-none transition-all duration-200 mb-5"
        />

        <Button
          onClick={startSession}
          disabled={!role.trim() || loading}
          loading={loading}
          className="w-full"
        >
          <PlayCircle className="h-4 w-4" />
          Start Live Interview
        </Button>
      </Card>
    </div>
  );
}
