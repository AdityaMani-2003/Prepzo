"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, VolumeX, Volume2, Loader2, Target, CheckCircle, AlertCircle, MessageSquare, Square, Building2 } from "lucide-react";
import { useStreamAI } from "@/hooks/useStreamAI";
import { useVoice } from "@/hooks/useVoice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabaseClient";
import { parseAIContent } from "@/utils/parseAI";

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

export default function InterviewPage() {
  // Primary Question State
  const [role, setRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [questionData, setQuestionData] = useState<{
    question: string;
    difficulty: string;
    topic: string;
  } | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // Follow-up State
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [followUpResult, setFollowUpResult] = useState<EvaluationResult | null>(null);

  // Loading & Error States
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const [loadingFollowUpEval, setLoadingFollowUpEval] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Streaming State Hooks
  const { streamState, startStream, stopStream } = useStreamAI();

  // Voice Interaction Engine
  const { 
    isListening, isSpeaking, supported, transcript, toggleListening, 
    speakText, stopSpeaking 
  } = useVoice();

  // Track active input block cleanly mapping the Voice hook buffer
  const [activeVoiceBlock, setActiveVoiceBlock] = useState<"answer" | "followUp" | null>(null);

  // SSR Hydration Safety
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
     setIsMounted(true);
  }, []);

  // Sync Voice accumulation instantly with candidate input blocks
  useEffect(() => {
    if (isListening && transcript) {
      if (activeVoiceBlock === "answer") setAnswer(transcript);
      if (activeVoiceBlock === "followUp") setFollowUpAnswer(transcript);
    }
  }, [transcript, isListening, activeVoiceBlock]);

  // Intelligent Context State
  const [hasResume, setHasResume] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkResumeStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && mounted) {
          const { data } = await supabase
            .from("resumes")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();
          
          if (mounted) setHasResume(!!data);
        }
      } catch (err) {
        console.error("Failed to check resume status:", err);
      }
    };
    
    checkResumeStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerateQuestion = async () => {
    if (!role.trim() || streamState.isStreaming) return;

    setError(null);
    setResult(null);
    setQuestionData(null);
    setAnswer("");
    
    // Clear Follow-up state
    setFollowUpQuestion(null);
    setFollowUpAnswer("");
    setFollowUpResult(null);

    await startStream(role, targetCompany);
  };
  
  // Sync finished stream into static context & Speak Output
  useEffect(() => {
    if (!streamState.isStreaming && streamState.text.length > 0 && streamState.topic) {
       setQuestionData({
          question: streamState.text,
          difficulty: streamState.difficulty || "hard",
          topic: streamState.topic
       });
       speakText(streamState.text); // Native Text-To-Speech Queue Trigger
    }
    if (streamState.error) {
       setError(streamState.error);
    }
  }, [streamState.isStreaming, streamState.text, streamState.topic, streamState.error, speakText]);

  const generateFollowUp = async (originalQuestion: string, candidateAnswer: string) => {
    setLoadingFollowUp(true);
    try {
      const res = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: originalQuestion, answer: candidateAnswer }),
      });

      if (!res.ok) throw new Error("Failed to generate follow-up.");

      const data = await res.json();
      setFollowUpQuestion(data.follow_up_question);
      speakText(data.follow_up_question); // Speak FollowUp
    } catch (err: any) {
      console.error("[interview] Follow-up generation failed:", err);
    } finally {
      setLoadingFollowUp(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!answer.trim() || !questionData || loadingEvaluation) return;

    setLoadingEvaluation(true);
    setError(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionData.question, answer, topic: questionData.topic }),
      });

      if (!res.ok) {
         throw new Error("Failed to evaluate answer.");
      }

      const data = await res.json();

      setResult(data);
      speakText(data.why_this_score); // Dictate Feedback Visually

      // Trigger follow-up generation asynchronously
      generateFollowUp(questionData.question, answer);
      
    } catch (err: any) {
      console.error("[interview] Evaluation failed:", err);
      setError("AI unavailable for evaluation.");
    } finally {
      setLoadingEvaluation(false);
    }
  };

  const handleEvaluateFollowUp = async () => {
    if (!followUpAnswer.trim() || !followUpQuestion || !questionData || loadingFollowUpEval) return;

    setLoadingFollowUpEval(true);
    setError(null);

    try {
      // Re-use evaluate engine, skill_metrics will automatically log under the same topic!
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: followUpQuestion, answer: followUpAnswer, topic: questionData.topic }),
      });

      if (!res.ok) throw new Error("Failed to evaluate follow-up answer.");

      const data = await res.json();

      setFollowUpResult(data);
      speakText(data.why_this_score); // Dictate Deep Feedback
    } catch (err: any) {
      setError("AI unavailable for follow-up evaluation.");
    } finally {
      setLoadingFollowUpEval(false);
    }
  };

  const ResultCard = ({ resObj, title }: { resObj: EvaluationResult; title: string }) => (
    <Card className="space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <CheckCircle className="h-5 w-5 text-gray-400" />
        <h2 className="text-lg font-medium text-white">{title}</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg bg-[#0a0a0a] border border-gray-800 p-4">
          <div className="text-sm text-gray-400">Clarity</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {resObj.score_breakdown.clarity}/10
          </div>
        </div>
        <div className="rounded-lg bg-[#0a0a0a] border border-gray-800 p-4">
          <div className="text-sm text-gray-400">Technical</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {resObj.score_breakdown.technical}/10
          </div>
        </div>
        <div className="rounded-lg bg-[#0a0a0a] border border-gray-800 p-4">
          <div className="text-sm text-gray-400">Communication</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {resObj.score_breakdown.communication || (resObj.score_breakdown as any).structure || 0}/10
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Strengths</h3>
          <ul className="space-y-2">
            {(resObj?.strengths || []).map((str, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="mt-1.5 block h-1 w-1 shrink-0 bg-gray-500" />
                <div dangerouslySetInnerHTML={{ __html: parseAIContent(str) }} />
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Areas for Improvement</h3>
          <ul className="space-y-2">
            {(resObj?.weaknesses || []).map((weak, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="mt-1.5 block h-1 w-1 shrink-0 bg-gray-600" />
                <div dangerouslySetInnerHTML={{ __html: parseAIContent(weak) }} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4 border-t border-gray-800 pt-6">
        <div>
          <h3 className="mb-2 text-sm font-medium text-white">Improved Answer</h3>
          <div 
            className="rounded-lg bg-[#0a0a0a] border border-gray-800 p-4 text-sm leading-relaxed text-gray-300"
            dangerouslySetInnerHTML={{ __html: parseAIContent(resObj.improved_answer) }}
          />
        </div>
        
        <div>
          <h3 className="mb-2 text-sm font-medium text-white">Overall Feedback</h3>
          <div 
            className="text-sm leading-relaxed text-gray-400"
            dangerouslySetInnerHTML={{ __html: parseAIContent(resObj.why_this_score) }}
          />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6 w-full animate-fadeInUp">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Mock Interview
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Practice with AI-generated questions tailored to your role.
          </p>
        </div>

        {/* Global TTS Audio Control */}
        {isMounted && window.speechSynthesis && (
          <Button
            variant="secondary"
            onClick={stopSpeaking}
            disabled={!isSpeaking}
            className={`gap-2 px-3 py-1 text-xs transition-colors ${isSpeaking ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : ""}`}
          >
            {isSpeaking ? <Volume2 className="h-4 w-4 animate-pulse" /> : <VolumeX className="h-4 w-4 opacity-50" />}
            {isSpeaking ? "Mute AI" : "Speaker"}
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3.5 text-[13px] text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* State-Aware Intelligent Experience Context */}
      {hasResume === false && (
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#111827] p-3.5 text-[13px] text-gray-400 animate-fadeInUp">
          <AlertCircle className="h-4 w-4 shrink-0 text-gray-500" />
          <p>Upload your resume for personalized questions. Currently using general questions.</p>
        </div>
      )}

      {hasResume === true && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-3.5 text-[13px] text-emerald-300 animate-fadeInUp">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <p>Questions personalized from your resume.</p>
        </div>
      )}

      {/* Role Input Section */}
      <Card>
        <label htmlFor="role" className="mb-3 block text-[13px] font-medium text-gray-500 dark:text-gray-400">
          What role are you preparing for?
        </label>
        <div className="flex gap-3">
          <input
            id="role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={streamState.isStreaming}
            placeholder="e.g. Senior Frontend Developer"
            className="flex-1"
          />
          {streamState.isStreaming ? (
            <Button
              onClick={stopStream}
              variant="secondary"
              className="gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15"
            >
              <Square className="h-3.5 w-3.5" fill="currentColor" />
              Stop
            </Button>
          ) : (
            <Button onClick={handleGenerateQuestion} disabled={!role.trim()}>
              Start Interview
            </Button>
          )}
        </div>

        {/* Target Company */}
        <div className="mt-4">
          <label htmlFor="targetCompany" className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            <Building2 className="h-3.5 w-3.5" />
            Target Company (optional)
          </label>
          <input
            id="targetCompany"
            type="text"
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
            disabled={streamState.isStreaming}
            placeholder="e.g. Google"
            className="w-full"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {["Google", "Amazon", "Microsoft", "Meta", "Startup"].map((company) => (
              <button
                key={company}
                type="button"
                onClick={() => setTargetCompany(company)}
                disabled={streamState.isStreaming}
                className={`rounded-full px-3 py-1 text-[11px] font-medium border transition-all duration-150 disabled:opacity-50 ${
                  targetCompany === company
                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30"
                    : "bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-gray-500 border-gray-200 dark:border-white/[0.06] hover:border-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300"
                }`}
              >
                {company}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Primary Question & Answer Section */}
      {(questionData || streamState.text.length > 0) && (
        <Card className="space-y-6 animate-fadeInUp">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                 <h2 className="text-[15px] font-semibold text-white">Interview Question</h2>
                 {streamState.isStreaming && <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" />}
              </div>
              
              <div className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-gray-400">
                {questionData?.topic || role} • {questionData?.difficulty || "hard"}
              </div>
            </div>
            
            <h3 className="text-[17px] font-medium leading-[1.65] text-gray-200">
              {streamState.isStreaming ? (
                <span>
                  {streamState.text}
                  <span className="ml-1 inline-block w-1.5 bg-indigo-400 h-4 translate-y-0.5 rounded-sm animate-pulse" />
                </span>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: parseAIContent(questionData?.question) }} />
              )}
            </h3>
          </div>

          <div className="space-y-4">
            <label
              htmlFor="answer"
              className="block text-sm font-medium text-gray-300"
            >
              Your Answer
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={loadingEvaluation || result !== null || streamState.isStreaming}
              placeholder="Type your answer here..."
              rows={5}
            />
            
            {!result && (
              <div className="flex items-center justify-between mt-2">
                <div>
                  {supported && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setActiveVoiceBlock("answer");
                        toggleListening();
                      }}
                      disabled={loadingEvaluation || streamState.isStreaming}
                      className={isListening && activeVoiceBlock === "answer" ? "animate-pulse bg-red-600 hover:bg-red-700 text-white border-red-500 py-1 px-3 text-xs" : "py-1 px-3 text-xs"}
                    >
                      {isListening && activeVoiceBlock === "answer" ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                      {isListening && activeVoiceBlock === "answer" ? "Listening..." : "Dictate Answer"}
                    </Button>
                  )}
                </div>
                
                <Button
                  onClick={handleEvaluateAnswer}
                  disabled={!answer.trim() || isListening}
                  loading={loadingEvaluation}
                >
                  Get Feedback
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Primary Result Section */}
      {result && <ResultCard resObj={result} title="Evaluation Result" />}

      {/* Dynamic Follow-up Section */}
      {loadingFollowUp && (
        <div className="flex flex-col items-center justify-center p-8 border border-white/[0.06] rounded-xl bg-[#111827]">
          <div className="skeleton h-4 w-48 mb-3" />
          <div className="skeleton h-3 w-32" />
        </div>
      )}

      {!loadingFollowUp && followUpQuestion && (
        <Card className="space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
            <MessageSquare className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-medium text-white">Follow-up Question</h2>
          </div>
          
          <h2 
            className="mt-4 text-lg font-medium leading-relaxed text-gray-300"
            dangerouslySetInnerHTML={{ __html: parseAIContent(followUpQuestion) }}
          />

          <div className="space-y-4 mt-6">
            <label htmlFor="followUpAnswer" className="block text-sm font-medium text-gray-400">
              Your Answer
            </label>
            <textarea
              id="followUpAnswer"
              value={followUpAnswer}
              onChange={(e) => setFollowUpAnswer(e.target.value)}
              disabled={loadingFollowUpEval || followUpResult !== null}
              placeholder="Address the follow-up..."
              rows={5}
            />
            
            {!followUpResult && (
              <div className="flex items-center justify-between mt-2">
                <div>
                  {supported && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setActiveVoiceBlock("followUp");
                        toggleListening();
                      }}
                      disabled={loadingFollowUpEval}
                      className={isListening && activeVoiceBlock === "followUp" ? "animate-pulse bg-red-600 hover:bg-red-700 text-white border-red-500 py-1 px-3 text-xs" : "py-1 px-3 text-xs"}
                    >
                      {isListening && activeVoiceBlock === "followUp" ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                      {isListening && activeVoiceBlock === "followUp" ? "Listening..." : "Dictate Answer"}
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleEvaluateFollowUp}
                  disabled={!followUpAnswer.trim() || isListening}
                  loading={loadingFollowUpEval}
                >
                  Evaluate Follow-up
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Follow-up Result Section */}
      {followUpResult && <ResultCard resObj={followUpResult} title="Follow-up Evaluation" />}

    </div>
  );
}
