"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  MessageSquare,
  ChevronDown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionItem {
  sessionId: string;
  role: string;
  date: string;
  messages: any[];
  avgScore: number | null;
}

export default function HistoryClientView({ initialSessions }: { initialSessions: SessionItem[] }) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const roles = useMemo(() => {
    const set = new Set<string>();
    initialSessions.forEach((s) => set.add(s.role));
    return Array.from(set);
  }, [initialSessions]);

  const filteredSessions = useMemo(() => {
    return initialSessions.filter((s) => {
      const matchesRole = selectedRole === "all" || s.role === selectedRole;
      const matchesSearch =
        search === "" ||
        s.role.toLowerCase().includes(search.toLowerCase()) ||
        s.messages.some((m) => m.content.toLowerCase().includes(search.toLowerCase()));
      return matchesRole && matchesSearch;
    });
  }, [initialSessions, selectedRole, search]);

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  if (initialSessions.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-12 text-center flex flex-col items-center">
        <div className="rounded-2xl bg-[var(--accent-subtle)] p-4 text-[var(--accent)] mb-4">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          No interview sessions recorded yet
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-sm">
          Complete your first mock interview to view archived evaluations and track improvement over time.
        </p>
        <Link href="/interview" className="mt-5">
          <Button variant="primary" className="h-10 px-5 text-xs font-semibold">
            Launch Mock Interview
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or keywords..."
            className="input-icon-left"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full sm:w-48 text-xs"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.map((session) => {
          const isExpanded = expandedSessionId === session.sessionId;

          // Group pairs of question -> answer -> evaluation
          const questions = session.messages.filter((m) => m.type === "question");
          const answers = session.messages.filter((m) => m.type === "answer");
          const evals = session.messages.filter((m) => m.type === "evaluation");

          return (
            <div
              key={session.sessionId}
              className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden transition-all duration-200"
            >
              {/* Header Bar */}
              <div
                onClick={() => toggleExpand(session.sessionId)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="rounded-xl bg-[var(--accent-subtle)] p-2.5 text-[var(--accent)] shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {session.role}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(session.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>• {questions.length} questions</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {session.avgScore ? (
                    <div className="text-right">
                      <span className="text-sm font-bold text-indigo-400">
                        {session.avgScore} / 10
                      </span>
                      <p className="text-[10px] text-[var(--text-muted)]">Avg Score</p>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Practice session</span>
                  )}

                  <ChevronDown
                    className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Drill-Down Content */}
              {isExpanded && (
                <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-6 animate-fadeIn">
                  {questions.map((q, idx) => {
                    const ans = answers[idx];
                    const ev = evals[idx];

                    return (
                      <div
                        key={q.id}
                        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 space-y-4"
                      >
                        {/* Question */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                            Question #{idx + 1}
                          </span>
                          <p className="text-sm font-medium text-[var(--text-primary)] mt-1">
                            {q.content}
                          </p>
                        </div>

                        {/* Answer */}
                        {ans && (
                          <div className="rounded-lg bg-[var(--bg-surface)] p-3 border border-[var(--border-subtle)]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                              Your Answer
                            </span>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                              {ans.content}
                            </p>
                          </div>
                        )}

                        {/* Evaluation */}
                        {ev && (
                          <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/10 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                AI Evaluation
                              </span>
                              <span className="text-xs font-bold text-indigo-300">
                                Score: {ev.score} / 10
                              </span>
                            </div>

                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                              &ldquo;{ev.content}&rdquo;
                            </p>

                            {ev.metadata?.strengths && ev.metadata.strengths.length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">
                                  Strengths:
                                </span>
                                <ul className="text-xs text-[var(--text-primary)] list-disc pl-4 mt-1 space-y-1">
                                  {ev.metadata.strengths.map((s: string, si: number) => (
                                    <li key={si}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {ev.metadata?.improved_answer && (
                              <div className="pt-2 border-t border-indigo-500/10">
                                <span className="text-[10px] font-bold text-indigo-300 uppercase">
                                  Model Answer:
                                </span>
                                <p className="text-xs text-[var(--text-muted)] mt-1 whitespace-pre-line">
                                  {ev.metadata.improved_answer}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
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
