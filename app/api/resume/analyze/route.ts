import { NextResponse } from "next/server";
import { callGemini } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  try {
    const { text, parsedText } = await request.json();

    // Accept either "text" or "parsedText" as the field name
    const resumeText = text || parsedText;

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "No resume text provided" },
        { status: 400 }
      );
    }



    const prompt = `
You are an expert ATS resume analyzer.

Extract structured data from the resume.

Return ONLY valid JSON. No explanation. No markdown.

Format:
{
"skills": ["..."],
"strengths": ["..."],
"weaknesses": ["..."],
"suggestions": ["..."]
}

Rules:

* skills: technologies, tools, languages
* strengths: positive traits
* weaknesses: missing areas or gaps
* suggestions: actionable improvements

Resume:
${resumeText.substring(0, 8000)}
`;

    // Safely generate using retry wrapper
    const rawText = await callGemini(prompt);


    if (!rawText) {
      throw new Error("Empty AI response from Gemini");
    }

    let parsed;
    try {
      let cleanText = rawText || "";
      cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanText);
    } catch (e) {
      console.error("PARSE FAILED:", rawText);
      throw new Error("Failed to parse evaluation response from AI.");
    }

    parsed.skills = Array.isArray(parsed.skills) ? parsed.skills : [];
    parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
    parsed.weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
    parsed.suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("AI ANALYSIS ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "AI analysis failed" },
      { status: 500 }
    );
  }
}
