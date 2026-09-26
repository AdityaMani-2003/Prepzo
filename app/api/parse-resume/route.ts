import { createClient } from "@/lib/supabaseServer";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name || "Resume.pdf";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If it's a text file
    if (file.type.includes("text") || fileName.endsWith(".txt")) {
      const text = buffer.toString("utf-8");
      return NextResponse.json({ text, fileName });
    }

    let extractedText = "";

    // 1. Try local PDF parser
    try {
      const pdfModule = require("pdf-parse");
      if (typeof pdfModule === "function") {
        const parsed = await pdfModule(buffer);
        extractedText = parsed?.text || "";
      } else if (pdfModule?.PDFParse) {
        // v2 instance approach
        const parser = new pdfModule.PDFParse();
        const parsed = await parser.parse(buffer);
        extractedText = parsed?.text || "";
      }
    } catch (parseErr) {
      console.warn("[parse-resume] Node PDF parse fallback:", parseErr);
    }

    // 2. If text is empty or too short (scanned PDF), use Gemini Vision OCR
    if (!extractedText || extractedText.trim().length < 50) {
      try {
        const base64Data = buffer.toString("base64");
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data,
                  },
                },
                {
                  text: "You are an OCR and document parsing engine. Extract all the textual content from this resume document accurately, maintaining clear sections (Summary, Skills, Work Experience, Education, Projects). Output ONLY the clean plain text of the resume.",
                },
              ],
            },
          ],
        });

        extractedText = response.text || "";
      } catch (ocrErr: any) {
        console.error("[parse-resume] Gemini OCR failed:", ocrErr);
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract readable text from this file." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: extractedText.trim(),
      fileName,
    });
  } catch (error: any) {
    console.error("[parse-resume] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process resume file" },
      { status: 500 }
    );
  }
}
