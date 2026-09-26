import { callGemini, streamGemini } from "@/lib/ai/gemini";
import { getCompanyProfile } from "@/lib/companyData";

export interface QuestionOptions {
  role: string;
  resumeText?: string;
  targetCompany?: string;
  roundType?: "mixed" | "dsa" | "sql" | "fundamentals" | "system-design" | "resume-deepdive" | "behavioral";
  experienceLevel?: "intern" | "junior" | "mid" | "senior";
}

function buildPrompt({
  role,
  resumeText,
  targetCompany,
  roundType = "mixed",
  experienceLevel = "junior",
}: QuestionOptions): string {
  const companyProfile = getCompanyProfile(targetCompany);

  // 1. Company Context
  let companyContext = "";
  if (companyProfile) {
    companyContext = `
TARGET COMPANY INTELLIGENCE:
Company: ${companyProfile.name} (${companyProfile.category})
Hiring Standard: ${companyProfile.interviewFocus}
Key Topics Emphasized: ${companyProfile.keyTopics.join(", ")}
DSA Style: ${companyProfile.dsaTopics.join(", ")}
SQL Focus: ${companyProfile.sqlFocus}
Behavioral Style: ${companyProfile.behavioralStyle}
Sample Real Questions at ${companyProfile.name}:
${companyProfile.realQuestionsSample.map((q) => `- [${q.round}] ${q.title}: ${q.prompt}`).join("\n")}
`;
  } else if (targetCompany && targetCompany.trim()) {
    companyContext = `\nTARGET COMPANY: ${targetCompany.trim()}. Tailor question difficulty and hiring bar to this organization's known technical interview standards.\n`;
  }

  // 2. Candidate Resume Context
  let candidateContext = "";
  if (resumeText && resumeText.trim().length > 0) {
    candidateContext = `
CANDIDATE RESUME PROFILE (Ground questions in their actual background):
"""
${resumeText.substring(0, 2000)}
"""
`;
  }

  // 3. Round-Specific Instructions
  let roundInstructions = "";
  if (roundType === "dsa") {
    roundInstructions = `
ROUND TYPE: Data Structures & Algorithms (Coding / DSA)
- Present a real, practical algorithmic problem asked in technical interviews.
- Avoid abstract narrative fluff. State the problem clearly:
  * Problem Statement
  * Input & Output specifications
  * 1-2 concrete Examples with inputs and expected outputs
  * Constraints (e.g. array length N <= 10^5, time limits)
- Ask the student to explain their approach, provide the solution (or pseudocode), and state the Time & Space Complexity.
- For Intern/Junior: Target standard LeetCode Easy to Medium patterns (Two Pointers, HashMaps, Sliding Window, Binary Search, Trees, Stacks).
- For Mid/Senior: Target LeetCode Medium to Hard patterns (Graphs, BFS/DFS, Heaps, Dynamic Programming, Topological Sort).
`;
  } else if (roundType === "sql") {
    roundInstructions = `
ROUND TYPE: SQL & Database Querying
- Present a realistic database querying question typically asked for ${role}.
- Must provide:
  * The business context (e.g. finding top performers, active churn, rolling metrics, or discrepancy detection)
  * Explicit Table Schema (table names, column names, and data types)
  * Example rows
  * Expected output format
- Ask the student to write the clean SQL query (PostgreSQL / MySQL compatible) and briefly explain their indexing or join considerations.
`;
  } else if (roundType === "fundamentals") {
    roundInstructions = `
ROUND TYPE: Core Computer Science & Technical Fundamentals
- Ask a direct, high-yield conceptual question that tests true understanding rather than memorization.
- For Frontend: Event Loop, Closure scope, React 19 reconciliation/Fiber, Virtual DOM, CSS layout models, browser caching.
- For Backend/Fullstack: ACID transactions, concurrency, connection pooling, REST vs GraphQL, Redis caching strategies, HTTP/2 vs HTTP/3.
- For General CS (e.g. TCS/Infosys/Entry): OOP pillars with real-world examples, Process vs Thread, Indexing B-Trees, TCP handshake.
- Feel free to include a short code snippet and ask "What will this output and why?" or "What is the critical bug in this implementation?".
`;
  } else if (roundType === "resume-deepdive") {
    roundInstructions = `
ROUND TYPE: Resume Project Deep-Dive & Architecture Defense
- Read the candidate's resume carefully. Pick a specific technology, project, or metric they claimed.
- Ask a probing, realistic question challenging how they implemented it in production:
  * "In your resume you mentioned [Project X] using [Tech Y]. What was the most difficult technical hurdle you faced, and how did you resolve it?"
  * Or: "How did you handle race conditions / scaling / data consistency in that architecture?"
- If no resume text is provided, ask them to describe their most technically complex project and explain the core architectural trade-offs.
`;
  } else if (roundType === "system-design") {
    roundInstructions = `
ROUND TYPE: System Design & Practical Architecture
- Present a realistic system design prompt tailored to ${role} (e.g. URL shortener, notification service, real-time location tracker, payment ledger).
- Give functional and non-functional requirements.
- Ask the candidate to cover High-Level Architecture, Data Model / Storage Choice, API Design, and Scaling / Bottlenecks.
`;
  } else if (roundType === "behavioral") {
    roundInstructions = `
ROUND TYPE: Behavioral & Culture Fit (STAR Method)
- Ask an impactful behavioral question testing ownership, leadership, conflict resolution, or recovering from critical mistakes.
${companyProfile?.id === "amazon" ? "- Must align with Amazon's 16 Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep)." : ""}
- Ask the candidate to structure their answer using the Situation-Task-Action-Result (STAR) framework.
`;
  } else {
    // Mixed Round
    roundInstructions = `
ROUND TYPE: Mixed Technical Interview Round
- Ask a practical, realistic technical interview question tailored to a ${role} (${experienceLevel} level).
- If the role is Frontend: focus on React/JavaScript or UI performance.
- If the role is Backend: focus on API design, SQL query, or system reliability.
- If the role is Fullstack: focus on end-to-end data flow, state synchronization, or database optimization.
- Avoid vague, convoluted scenarios. Make it actionable and realistic so the student can formulate a crisp answer.
`;
  }

  const prompt = `
You are an expert technical interviewer conducting a mock interview for a student/candidate preparing for real industry interviews.

CANDIDATE TARGET:
Role: ${role}
Seniority Tier: ${experienceLevel.toUpperCase()} (Intern / Campus Graduate = practical fundamentals & clear reasoning; Senior = scale & trade-offs)
${companyContext}
${candidateContext}
${roundInstructions}

IMPORTANT RULES:
1. Make the question PRACTICAL and REALISTIC. Never invent bizarre, convoluted 500-word corporate scenarios. Human interviewers ask clear, direct questions.
2. If asking a Coding/DSA or SQL question, provide the necessary inputs/outputs, schemas, or constraints.
3. Keep the prompt focused, engaging, and professional.
4. Return ONLY the plain text of the question (use clean formatting with bullet points or code blocks where appropriate).
`;

  return prompt;
}

export async function generateQuestion(options: string | QuestionOptions, legacyResumeText?: string) {
  const opts: QuestionOptions =
    typeof options === "string"
      ? { role: options, resumeText: legacyResumeText }
      : options;

  const prompt = buildPrompt(opts);

  try {
    const response = await callGemini(prompt);

    if (!response || response.trim() === "") {
      throw new Error("Empty response from AI engine");
    }

    return {
      question: response.trim(),
      difficulty: opts.experienceLevel || "intermediate",
      topic: opts.role,
    };
  } catch (error) {
    console.error("QUESTION ERROR:", error);
    throw error;
  }
}

export async function* streamQuestion(
  roleOrOptions: string | QuestionOptions,
  legacyResumeText?: string,
  legacyTargetCompany?: string
): AsyncGenerator<string, void, unknown> {
  const opts: QuestionOptions =
    typeof roleOrOptions === "string"
      ? {
          role: roleOrOptions,
          resumeText: legacyResumeText,
          targetCompany: legacyTargetCompany,
        }
      : roleOrOptions;

  const prompt = buildPrompt(opts);

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
  const contextBlock =
    ragContext && ragContext.trim().length > 0
      ? `\nBackground Resume Context (Fact Check the candidate against their own historical data):\n"""\n${ragContext}\n"""\n`
      : "";

  const prompt = `
You are a Principal Technical Interviewer and Engineering Mentor.
Evaluate this student candidate's interview response with honesty, rigor, and pedagogical clarity.

${contextBlock}
QUESTION ASKED:
${question}

CANDIDATE'S ANSWER:
${answer}

EVALUATION INSTRUCTIONS:
1. Score the answer across three dimensions (scale 1 to 10):
   - clarity: structure, articulation, conciseness
   - technical: correctness, algorithm/query validity, edge case awareness, depth
   - communication: rationale, explaining "why", trade-off evaluation
2. Identify 2-3 genuine Strengths.
3. Identify 2-3 specific, actionable Weaknesses / Areas for Improvement.
4. Provide the "improved_answer" (a polished, model response from a strong candidate).
5. Provide the "optimal_solution": If this was a Coding/DSA question, provide clean optimal code (in Python or JavaScript/TypeScript) with time & space complexity. If this was a SQL question, provide the clean optimal SQL query. If conceptual or design, provide the key architectural blueprint.
6. Provide "why_this_score": 2-3 sentences explaining what elevated or hurt their score.

Return ONLY valid JSON matching this schema, without any markdown backticks or fences:
{
  "score_breakdown": {
    "clarity": number,
    "technical": number,
    "communication": number
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "improved_answer": "string",
  "optimal_solution": "string",
  "why_this_score": "string"
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
  const contextBlock =
    ragContext && ragContext.trim().length > 0
      ? `\nCandidate's Background Context:\n"""\n${ragContext}\n"""\n`
      : "";

  const prompt = `
You are a senior technical interviewer.
Based on the candidate's answer to the question below, ask ONE sharp, realistic follow-up question.

${contextBlock}
Original Question: ${question}
Candidate Answer: ${answer}

RULES:
- If they gave an algorithm, ask about an edge case (e.g., negative numbers, empty input, huge data) or how to optimize time/space.
- If they gave a SQL query, ask how they would index the table for large volume or handle NULL values.
- If they gave a system design answer, ask about a single point of failure or caching invalidation.
- If they contradicted their resume, ask them to clarify the discrepancy.

Return ONLY valid JSON, no explanation, no markdown:
{
  "follow_up_question": "string"
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
