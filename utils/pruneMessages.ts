import type { SupabaseClient } from "@supabase/supabase-js";

/** Maximum number of interview_messages rows kept per user. */
const MAX_MESSAGES_PER_USER = 200;

/**
 * Non-blocking pruning helper.
 * If the user exceeds MAX_MESSAGES_PER_USER rows in interview_messages,
 * the oldest excess rows are deleted. Errors are silently swallowed so
 * they never break the calling API route.
 */
export async function pruneOldMessages(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    const { count } = await supabase
      .from("interview_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (!count || count <= MAX_MESSAGES_PER_USER) return;

    const excess = count - MAX_MESSAGES_PER_USER;

    const { data: oldest } = await supabase
      .from("interview_messages")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(excess);

    if (oldest && oldest.length > 0) {
      const ids = oldest.map((r: { id: string }) => r.id);
      await supabase.from("interview_messages").delete().in("id", ids);
    }
  } catch {
    // Intentionally swallowed — pruning is best-effort
    console.warn("[pruneMessages] Skipped:", userId);
  }
}

/**
 * Safely truncate a string to a max byte-length to prevent large text
 * from bloating database rows.
 */
export function truncate(text: string, maxChars: number): string {
  if (!text || text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}
