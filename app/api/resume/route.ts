import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { generateEmbedding } from "@/lib/ai/gemini";

// Utility: Semantic Text Chunking Algorithm (Target: ~300 words per node)
function chunkText(text: string, maxWordsPerChunk = 300): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxWordsPerChunk) {
      chunks.push(currentChunk.join(" "));
      // Overlap by 50 words to maintain semantic bleeding between nodes
      currentChunk = currentChunk.slice(currentChunk.length - 50); 
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }
  
  return chunks;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Get current authenticated user
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

    // 2. Parse request body
    const body = await request.json();
    const { fileName, parsedText } = body;

    if (!fileName || !parsedText) {
      return NextResponse.json(
        { error: "Missing 'fileName' or 'parsedText' in the request." },
        { status: 400 }
      );
    }

    // 3. Insert into the Database
    const { data, error: dbError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_name: fileName,
        parsed_text: parsedText,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database Error inserting resume:", dbError);
      return NextResponse.json(
        { error: "Failed to save resume strictly to the database." },
        { status: 500 }
      );
    }

    // 4. Vector Context Semantic Pipeline (RAG)
    try {

      
      // Clear previous embeddings to prevent context poisoning across multiple uploads
      await supabase.from("resume_embeddings").delete().eq("user_id", user.id);
      
      const chunks = chunkText(parsedText);

      
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
           console.error("[RAG Engine] Partial Node Vector mapping failed. Skipping node safely.", embedErr);
        }
      }

    } catch (ragError) {
      console.error("[RAG Engine] Fatal Vector Mapping Failure! System falling back dynamically:", ragError);
      // We explicitly swallow to prevent breaking upload UI, RAG gracefully degrades if missing
    }

    // 4. Return success
    return NextResponse.json(
      { success: true, message: "Resume uploaded successfully.", id: data?.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API error during resume process:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
