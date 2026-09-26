import { createClient } from "@/lib/supabaseServer";
import { generateEmbedding } from "@/lib/ai/gemini";
import { truncate } from "@/utils/pruneMessages";
import { NextRequest, NextResponse } from "next/server";

function chunkText(text: string, wordsPerChunk = 700, overlap = 35, maxChunks = 10): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length && chunks.length < maxChunks; i += wordsPerChunk - overlap) {
    const chunkWords = words.slice(i, i + wordsPerChunk);
    if (chunkWords.length > 0) {
      chunks.push(chunkWords.join(" "));
    }
  }

  return chunks;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: resume, error } = await supabase
      .from("resumes")
      .select("id, file_name, parsed_text, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ resume: resume || null });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, parsedText } = await req.json();

    if (!parsedText || typeof parsedText !== "string" || parsedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Valid resume text content is required" },
        { status: 400 }
      );
    }

    const cleanName = fileName || "Resume.pdf";
    const truncatedText = truncate(parsedText.trim(), 8000);

    // 1. Upsert into resumes table (one row per user)
    const { error: upsertError } = await supabase
      .from("resumes")
      .upsert(
        {
          user_id: user.id,
          file_name: cleanName,
          parsed_text: truncatedText,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[api/resume] Upsert error:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // 2. Clear old embeddings to prevent context poisoning
    try {
      await supabase.from("resume_embeddings").delete().eq("user_id", user.id);
    } catch (delErr) {
      console.warn("[api/resume] Failed to clean old embeddings:", delErr);
    }

    // 3. Chunk & Generate pgvector embeddings (max 10 chunks)
    const chunks = chunkText(truncatedText);
    let embeddedCount = 0;

    for (const chunk of chunks) {
      try {
        const vector = await generateEmbedding(chunk);
        await supabase.from("resume_embeddings").insert({
          user_id: user.id,
          content: truncate(chunk, 3000),
          embedding: vector,
        });
        embeddedCount++;
      } catch (embErr) {
        console.warn("[api/resume] Failed embedding chunk:", embErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Resume saved and vectorized successfully",
      chunksCount: embeddedCount,
    });
  } catch (error: any) {
    console.error("[api/resume] POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process resume" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await supabase.from("resume_embeddings").delete().eq("user_id", user.id);
    await supabase.from("resumes").delete().eq("user_id", user.id);

    return NextResponse.json({ success: true, message: "Resume deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete resume" },
      { status: 500 }
    );
  }
}
