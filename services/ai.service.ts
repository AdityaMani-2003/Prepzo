import { callGemini, streamGemini } from "@/lib/ai/gemini";

export async function generateQuestion(role: string, resumeText?: string) {
  const prompt = resumeText && resumeText.trim().length > 0 
    ? `Generate a technical interview question for a ${role}.
       Base it loosely around this resume context: ${resumeText.substring(0, 1000)}

       Rules:
       * Must be realistic (FAANG level)
       * Clear and specific
       * Not generic
       
       Return ONLY plain text question.`
    : `Generate a technical interview question for a ${role}.

       Rules:
       * Must be realistic (FAANG level)
       * Clear and specific
       * Not generic
       
       Return ONLY plain text question.`;

  try {
    const response = await callGemini(prompt);
    
    if (!response || response.trim() === "") {
        throw new Error("Empty AI response from Gemini");
    }

    return {
      question: response.trim(),
      difficulty: "hard",
      topic: role,
    };
  } catch (error) {
    console.error("QUESTION ERROR:", error);
    throw error;
  }
}

export async function* streamQuestion(role: string, resumeText?: string, targetCompany?: string): AsyncGenerator<string, void, unknown> {
  const companyContext = targetCompany && targetCompany.trim().length > 0
    ? `\n       The candidate is targeting ${targetCompany}. Tailor question difficulty and style accordingly.\n       For top-tier companies (FAANG/MAANG), increase difficulty. For startups, focus on breadth and adaptability.`
    : "";

  const prompt = resumeText && resumeText.trim().length > 0 
    ? `Generate a technical interview question for a ${role}.
       Base it loosely around this resume context: ${resumeText.substring(0, 1000)}
${companyContext}
       Rules:
       * Must be realistic (FAANG level)
       * Clear and specific
       * Not generic
       
       Return ONLY plain text question without Markdown wrapping.`
    : `Generate a technical interview question for a ${role}.
${companyContext}
       Rules:
       * Must be realistic (FAANG level)
       * Clear and specific
       * Not generic
       
       Return ONLY plain text question without Markdown wrapping.`;

  try {
    const generator = streamGemini(prompt);
    for await (const chunk of generator) {
      if (chunk) yield chunk;
    }
  } catch (error) {
    console.error("STREAM QUESTION ERROR:", error);
    throw error;
  }
}


export async function evaluateAnswer(question: string, answer: string, ragContext?: string) {
  const contextBlock = ragContext && ragContext.trim().length > 0 
      ? `\nBackground Resume Context (Fact Check the candidate against their own historical data):\n"""\n${ragContext}\n"""\n`
      : "";

  const prompt = `
  Evaluate this interview answer.
  ${contextBlock}
  Question: ${question}
  Answer: ${answer}

  Return ONLY valid JSON, no explanation, no markdown:
  {
    "score_breakdown": {
      "clarity": number,
      "technical": number,
      "communication": number
    },
    "strengths": ["..."],
    "weaknesses": ["..."],
    "improved_answer": "...",
    "why_this_score": "..."
  }
  `;

  const response = await callGemini(prompt);
  const cleaned = response.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("evaluateAnswer parse failed:", cleaned.substring(0, 200));
    throw new Error("Failed to parse evaluation response from AI.");
  }
}

export async function generateFollowUp(question: string, answer: string, ragContext?: string) {
  const contextBlock = ragContext && ragContext.trim().length > 0 
      ? `\nCandidate's Background Context:\n"""\n${ragContext}\n"""\nIf the background matches their answer, challenge them deeper on their claims. If it contradicts, ask them to clarify the discrepancy.\n`
      : "";

  const prompt = `
  You are a senior interviewer.

  Based on the candidate's answer, ask ONE deeper follow-up question.
  ${contextBlock}
  Original Question: ${question}
  Candidate Answer: ${answer}

  Return ONLY valid JSON, no explanation, no markdown:
  {
    "follow_up_question": "..."
  }
  `;

  const response = await callGemini(prompt);
  const cleaned = response.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return { follow_up_question: parsed.follow_up_question || cleaned };
  } catch {
    console.error("generateFollowUp parse failed:", cleaned.substring(0, 200));
    throw new Error("Failed to parse follow-up response from AI.");
  }
}
