import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { generateEmbedding } from "@/lib/ai/gemini";

/** Max characters stored for parsed_text. Keeps resumes table lean. */
const MAX_RESUME_TEXT_CHARS = 8000;

/** Max embedding chunks per user. Each vector(768) ≈ 3 KB of storage. */
const MAX_CHUNKS = 10;

/**
 * Semantic chunking with a hard cap on the number of chunks produced.
 * Larger maxWordsPerChunk means fewer, broader chunks → fewer DB rows.
 */
function chunkText(text: string, maxWordsPerChunk = 800): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxWordsPerChunk) {
      chunks.push(currentChunk.join(" "));
      if (chunks.length >= MAX_CHUNKS) break; // hard cap
      // 30-word overlap to preserve context at boundaries
      currentChunk = currentChunk.slice(currentChunk.length - 30);
    }
  }

  if (currentChunk.length > 0 && chunks.length < MAX_CHUNKS) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    // 2. Parse body
    const body = await request.json();
    const { fileName, parsedText } = body;

    if (!fileName || !parsedText) {
      return NextResponse.json(
        { error: "Missing 'fileName' or 'parsedText' in the request." },
        { status: 400 }
      );
    }

    // 3. Truncate stored text (saves storage; full text used for embeddings below)
    const storedText =
      parsedText.length > MAX_RESUME_TEXT_CHARS
        ? parsedText.slice(0, MAX_RESUME_TEXT_CHARS)
        : parsedText;

    // 4. Upsert resume — one row per user, overwrite on re-upload
    const { data, error: dbError } = await supabase
      .from("resumes")
      .upsert(
        {
          user_id: user.id,
          file_name: fileName,
          parsed_text: storedText,
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (dbError) {
      console.error("Database Error upserting resume:", dbError);
      return NextResponse.json(
        { error: "Failed to save resume to the database." },
        { status: 500 }
      );
    }

    // 5. Vector RAG pipeline — use full text for embeddings, capped at MAX_CHUNKS
    try {
      // Clear previous embeddings to prevent context poisoning
      await supabase
        .from("resume_embeddings")
        .delete()
        .eq("user_id", user.id);

      const chunks = chunkText(parsedText); // uses full text for better embedding quality

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        try {
          const vectorArray = await generateEmbedding(chunk);
          await supabase.from("resume_embeddings").insert({
            user_id: user.id,
            content: chunk,
            embedding: vectorArray,
          });
        } catch (embedErr) {
          console.error(
            "[RAG Engine] Partial node vector mapping failed. Skipping.",
            embedErr
          );
        }
      }
    } catch (ragError) {
      console.error(
        "[RAG Engine] Fatal vector mapping failure, falling back gracefully:",
        ragError
      );
    }

    return NextResponse.json(
      { success: true, message: "Resume uploaded successfully.", id: data?.id },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("API error during resume process:", msg);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
