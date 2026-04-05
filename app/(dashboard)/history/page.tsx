"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, ChevronDown, ArrowUpRight, ArrowDownRight, MessageSquare, Target, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { parseAIContent } from "@/utils/parseAI";

interface SessionMessage {
  id: string;
  session_id: string;
  user_id: string;
  type: string;
  content: string;
  score?: number;
  metadata?: any;
  created_at: string;
}

interface GroupedSession {
  sessionId: string;
  date: string;
  dateLabel: string;
  role: string;
  score: number;
  eloChange: number;
  messages: SessionMessage[];
}

export default function HistoryPage() {
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchHistory() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        const { data, error } = await supabase
          .from("interview_messages")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("History fetch error:", error);
          return;
        }
        if (mounted && data) setMessages(data);
      } catch (err) {
        console.error("History fetch exception:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchHistory();
    return () => { mounted = false; };
  }, []);

  const sessions = useMemo(() => {
    const groups = new Map<string, SessionMessage[]>();

    for (const msg of messages) {
      const sid = msg.session_id;
      if (!groups.has(sid)) groups.set(sid, []);
      groups.get(sid)!.push(msg);
    }

    const grouped: GroupedSession[] = [];
    let runningElo = 1200;

    // Sort session groups by earliest message date
    const sortedEntries = [...groups.entries()].sort((a, b) => {
      const aDate = new Date(a[1][a[1].length - 1].created_at).getTime();
      const bDate = new Date(b[1][b[1].length - 1].created_at).getTime();
      return aDate - bDate;
    });

    for (const [sessionId, msgs] of sortedEntries) {
      const evalMsg = msgs.find((m) => m.type === "evaluation");
      const questionMsg = msgs.find((m) => m.type === "question");
      const score = evalMsg?.score || 0;
      const prevElo = runningElo;
      runningElo = Math.round(runningElo + 20 * (score / 10 - 0.5));
      const eloChange = runningElo - prevElo;

      const date = new Date(msgs[0].created_at);
      const dateLabel = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      grouped.push({
        sessionId,
        date: msgs[0].created_at,
        dateLabel,
        role: evalMsg?.metadata?.topic || questionMsg?.metadata?.topic || "Interview",
        score,
        eloChange,
        messages: msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      });
    }

    // Return in reverse chronological order
    return grouped.reverse();
  }, [messages]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fadeInUp">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-[13px] text-gray-500">Loading your interview history...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeInUp">
        <div className="rounded-2xl bg-gray-100 dark:bg-white/[0.03] p-6 mb-5">
          <Clock className="h-9 w-9 text-gray-400 dark:text-gray-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">No sessions yet</h2>
        <p className="text-[13px] text-gray-500 max-w-sm mb-6">
          Start your first practice interview to build your history!
        </p>
        <Link
          href="/interview"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-400 transition-all"
        >
          <MessageSquare className="h-4 w-4" />
          Start Interview
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl animate-fadeInUp">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Interview History</h1>
        <p className="text-[13px] text-gray-500 mt-1">Review your past sessions and track your progress.</p>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const isExpanded = expandedSession === session.sessionId;

          return (
            <div
              key={session.sessionId}
              className="card-interactive rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06]"
            >
              {/* Session header */}
              <button
                type="button"
                onClick={() => setExpandedSession(isExpanded ? null : session.sessionId)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 shrink-0">
                    <MessageSquare className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{session.role}</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">{session.dateLabel}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {session.score > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3 w-3 text-gray-400" />
                      <span className="text-[13px] font-bold text-gray-900 dark:text-white">{session.score}/10</span>
                    </div>
                  )}
                  <div className={`flex items-center gap-0.5 text-[12px] font-semibold ${
                    session.eloChange >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {session.eloChange >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {session.eloChange >= 0 ? "+" : ""}{session.eloChange}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Expanded Q&A */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/[0.04] pt-3 space-y-3">
                  {session.messages.map((msg) => {
                    if (msg.type === "question") {
                      return (
                        <div key={msg.id} className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] p-3">
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Question</span>
                          <div 
                            className="text-[13px] text-gray-700 dark:text-gray-300 mt-1 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: parseAIContent(msg.content) }}
                          />
                        </div>
                      );
                    }
                    if (msg.type === "answer") {
                      return (
                        <div key={msg.id} className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] p-3">
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Your Answer</span>
                          <p className="text-[13px] text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{msg.content}</p>
                        </div>
                      );
                    }
                    if (msg.type === "evaluation" && msg.metadata) {
                      return (
                        <div key={msg.id} className="rounded-lg bg-indigo-50 dark:bg-indigo-500/[0.04] border border-indigo-200 dark:border-indigo-500/15 p-3">
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">AI Feedback</span>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {msg.metadata.score_breakdown && Object.entries(msg.metadata.score_breakdown).map(([key, val]) => (
                              <div key={key} className="text-center rounded bg-white dark:bg-white/[0.03] p-2">
                                <span className="text-[10px] text-gray-500 capitalize">{key}</span>
                                <p className="text-[14px] font-bold text-gray-900 dark:text-white">{val as number}/10</p>
                              </div>
                            ))}
                          </div>
                          {msg.metadata.why_this_score && (
                            <div 
                              className="text-[12px] text-gray-600 dark:text-gray-400 mt-2 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: parseAIContent(msg.metadata.why_this_score) }}
                            />
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
