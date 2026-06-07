import { createClient } from "@/lib/supabaseServer";

export interface FeedbackData {
  user_id: string;
  question: string;
  user_answer: string;
  clarity_score: number;
  technical_score: number;
  structure_score: number;
  strengths: string[];
  weaknesses: string[];
  improved_answer: string;
}

/**
 * Saves skill metrics derived from an evaluation.
 * Note: Raw feedback data is stored directly in interview_messages.metadata
 * (type = 'evaluation') to avoid duplicating large text blobs in a separate table.
 */
export async function saveFeedback(data: FeedbackData, topic?: string) {
  const supabase = await createClient();

  // Update skill_metrics table if a topic was provided
  if (topic) {
    const averageScore = Math.round(
      (data.clarity_score + data.technical_score + data.structure_score) / 3
    );

    // Check if a row already exists for this user and topic
    const { data: existingMetric } = await supabase
      .from("skill_metrics")
      .select("id")
      .eq("user_id", data.user_id)
      .eq("skill_name", topic)
      .single();

    if (existingMetric) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("skill_metrics")
        .update({
          score: averageScore,
          last_updated: new Date().toISOString(),
        })
        .eq("id", existingMetric.id);

      if (updateError) {
        console.error("[saveFeedback] skill_metrics update error:", updateError);
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("skill_metrics")
        .insert([
          {
            user_id: data.user_id,
            skill_name: topic,
            score: averageScore,
            last_updated: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.error("[saveFeedback] skill_metrics insert error:", insertError);
      }
    }
  }
}
