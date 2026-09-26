import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabaseServer";
import HistoryClientView from "./HistoryClientView";

export const metadata = {
  title: "Interview History — Prepzo",
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all user messages ordered by date
  const { data: messages } = await supabase
    .from("interview_messages")
    .select("id, session_id, type, content, score, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Group into sessions
  const sessionsMap = new Map<string, {
    sessionId: string;
    role: string;
    date: string;
    messages: any[];
    avgScore: number | null;
  }>();

  (messages || []).forEach((msg) => {
    const sId = msg.session_id;
    if (!sessionsMap.has(sId)) {
      sessionsMap.set(sId, {
        sessionId: sId,
        role: msg.metadata?.role || msg.metadata?.topic || "Technical Interview",
        date: msg.created_at,
        messages: [],
        avgScore: null,
      });
    }
    sessionsMap.get(sId)!.messages.push(msg);
  });

  const sessions = Array.from(sessionsMap.values()).map((s) => {
    const evalMsgs = s.messages.filter((m) => m.type === "evaluation" && m.score != null);
    const avg =
      evalMsgs.length > 0
        ? Number(
            (
              evalMsgs.reduce((acc, m) => acc + Number(m.score), 0) / evalMsgs.length
            ).toFixed(1)
          )
        : null;

    return {
      ...s,
      avgScore: avg,
    };
  });

  return (
    <div className="max-w-5xl mx-auto pb-16 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
          <Clock className="h-4 w-4" />
          Archive & Drill-Down
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Interview Session History
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Review previous mock interviews, analyze question-level AI evaluations, and verify your progression.
        </p>
      </div>

      <HistoryClientView initialSessions={sessions} />
    </div>
  );
}
