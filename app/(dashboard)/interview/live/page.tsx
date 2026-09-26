"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft, Sparkles, Loader2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/useVoice";

export default function LiveInterviewPage() {
  const [role, setRole] = useState("Full Stack Engineer");
  const [sessionActive, setSessionActive] = useState(false);
  const [aiStatus, setAiStatus] = useState<"idle" | "speaking" | "listening" | "thinking">("idle");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [candidateResponse, setCandidateResponse] = useState("");
  const [sessionElapsed, setSessionElapsed] = useState(0);

  const {
    isListening,
    transcript,
    toggleListening,
    speakText,
    stopSpeaking,
    isSpeaking,
  } = useVoice();

  // Sync candidate speech
  useEffect(() => {
    if (isListening) {
      if (transcript) setCandidateResponse(transcript);
      setAiStatus("listening");
    } else if (isSpeaking) {
      setAiStatus("speaking");
    }
  }, [isListening, isSpeaking, transcript]);

  // Timer
  useEffect(() => {
    let t: any;
    if (sessionActive) {
      t = setInterval(() => setSessionElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(t);
  }, [sessionActive]);

  const handleStartLive = async () => {
    setSessionActive(true);
    setAiStatus("thinking");
    setCurrentQuestion("Hello! I'm your AI interviewer. Let's begin. Can you introduce yourself and talk about the most technically challenging project you've led recently?");
    
    setTimeout(() => {
      setAiStatus("speaking");
      speakText("Hello! I'm your AI interviewer. Let's begin. Can you introduce yourself and talk about the most technically challenging project you've led recently?");
    }, 1000);
  };

  const handleEndLive = () => {
    setSessionActive(false);
    stopSpeaking();
    if (isListening) toggleListening();
    setAiStatus("idle");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[80vh] max-w-3xl mx-auto py-8 text-center">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <Link href="/interview" className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Live Mode</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">
            {formatTime(sessionElapsed)}
          </span>
        </div>
      </div>

      {/* Main Avatar / Orb Area */}
      <div className="flex flex-col items-center my-auto">
        <div className="relative flex items-center justify-center mb-8">
          {/* Animated Glow Rings */}
          <div
            className={`absolute h-48 w-48 rounded-full transition-all duration-700 ${
              aiStatus === "speaking"
                ? "bg-purple-600/30 scale-125 blur-xl animate-pulse"
                : aiStatus === "listening"
                ? "bg-emerald-500/20 scale-110 blur-lg"
                : "bg-indigo-600/10 scale-100 blur-md"
            }`}
          />

          {/* Central AI Orb */}
          <div
            className={`relative flex h-32 w-32 items-center justify-center rounded-full border border-white/10 shadow-2xl transition-all duration-500 ${
              aiStatus === "speaking"
                ? "bg-gradient-to-tr from-indigo-600 to-purple-500 scale-105"
                : aiStatus === "listening"
                ? "bg-gradient-to-tr from-emerald-600 to-teal-500"
                : "bg-gradient-to-tr from-slate-800 to-slate-900"
            }`}
          >
            <Sparkles className="h-10 w-10 text-white animate-spin-slow" />
          </div>
        </div>

        {/* Status indicator */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] mb-4">
          {aiStatus === "idle" && "Ready to start live session"}
          {aiStatus === "thinking" && "AI is preparing question..."}
          {aiStatus === "speaking" && "AI is speaking..."}
          {aiStatus === "listening" && "Listening to your answer..."}
        </div>

        {/* Question Prompt */}
        {currentQuestion && (
          <p className="max-w-xl text-base md:text-lg font-medium text-[var(--text-primary)] leading-relaxed mb-6">
            &ldquo;{currentQuestion}&rdquo;
          </p>
        )}

        {/* Real-time Candidate Transcript */}
        {candidateResponse && (
          <div className="max-w-lg rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] p-4 text-xs text-[var(--text-secondary)] leading-relaxed italic">
            {candidateResponse}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="w-full flex items-center justify-center gap-4 pt-6 border-t border-[var(--border-subtle)]">
        {!sessionActive ? (
          <Button
            variant="primary"
            onClick={handleStartLive}
            className="h-12 px-8 text-sm font-semibold shadow-[var(--shadow-glow)]"
          >
            <Mic className="h-4 w-4 mr-2" />
            Begin Live Voice Interview
          </Button>
        ) : (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleListening}
              className={`rounded-full p-4 transition-all ${
                isListening
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)]"
              }`}
            >
              {isListening ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </button>

            <Button variant="danger" onClick={handleEndLive} className="h-11 px-5 text-xs font-semibold">
              <StopCircle className="h-4 w-4 mr-1.5" />
              End Live Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
