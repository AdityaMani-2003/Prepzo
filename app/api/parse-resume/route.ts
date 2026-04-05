import { createClient } from "@/lib/supabaseServer";
import { GoogleGenAI } from "@google/genai";
const pdfParse = require("pdf-parse");

// Increase potential edge execution timeout
export const maxDuration = 60; // 60 seconds
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized access." }), { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided." }), { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File exceeds 5MB size limit." }), { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";
    let source = "pdf-parse";

    if (file.type === "application/pdf") {
      try {
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text;
      } catch (err) {
        console.warn("[parse-resume] pdf-parse failed, likely heavily formatted or corrupted mapping.");
      }

      // OCR Fallback Triggers
      if (!extractedText || extractedText.trim().length < 50) {
        source = "gemini-ocr";
        
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
          const base64Data = buffer.toString("base64");

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              "You are a strict data-extraction engine. Extract all readable text from this document. Output ONLY the raw textual data without conversation, without formatting modifications, and absolutely no markdown blocks. Do not summarize.",
              {
                inlineData: {
                  data: base64Data,
                  mimeType: "application/pdf"
                }
              }
            ]
          });

          extractedText = response.text || "";
        } catch (ocrErr: any) {
          console.error("[parse-resume] Gemini OCR failed:", ocrErr);
          return new Response(JSON.stringify({ 
            error: "Document mapping completely failed. The file may be corrupt or heavily locked. Please try a standard text-based PDF."
          }), { status: 422 });
        }
      }
    } else if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8");
      source = "text-parse";
    } else {
       return new Response(JSON.stringify({ error: "Unsupported file type." }), { status: 400 });
    }

    if (!extractedText || extractedText.trim().length === 0) {
       return new Response(JSON.stringify({ error: "File successfully processed but contained no detectable text elements." }), { status: 422 });
    }

    return new Response(JSON.stringify({ text: extractedText.trim(), source }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[parse-resume] Fatal pipeline crash:", err);
    return new Response(JSON.stringify({ error: "Internal server processing failure." }), { status: 500 });
  }
}
