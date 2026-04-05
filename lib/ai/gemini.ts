import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("FATAL: GEMINI_API_KEY is not set in environment variables!");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
});

/**
 * Extract Google's suggested retry delay from error message.
 * Google returns something like "retryDelay":"46s" in 429 errors.
 */
function extractRetryDelay(errorMessage: string): number {
  const match = errorMessage?.match(/retryDelay.*?(\d+)s/);
  if (match) {
    return parseInt(match[1], 10) * 1000; // convert to ms
  }
  return 60000; // default 60s if not found
}

export async function callGemini(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to your .env.local file.");
  }

  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }



      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text;


      return text ?? "No response";
    } catch (error: any) {
      const status = error?.status || error?.code;
      const message = error?.message || "Unknown error";

      console.error(`[Gemini] Attempt ${attempt + 1} FAILED — status: ${status}`);
      console.error(`[Gemini] Error: ${message.substring(0, 300)}`);

      if (status === 429 && attempt < MAX_RETRIES) {
        // Parse Google's suggested wait time
        const waitMs = extractRetryDelay(message);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      if (status >= 500 && attempt < MAX_RETRIES) {
        const waitMs = 5000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      // Build a clear error message for the user
      if (status === 429) {
        throw new Error(
          "Gemini API rate limit exceeded. Your free tier quota is exhausted. " +
          "Please generate a new API key in a NEW Google Cloud project at https://aistudio.google.com, " +
          "or wait a few minutes and try again."
        );
      }

      if (status === 403) {
        throw new Error(
          "Gemini API key is invalid or disabled. " +
          "Please generate a new key at https://aistudio.google.com"
        );
      }

      throw new Error(`Gemini API error (${status}): ${message.substring(0, 200)}`);
    }
  }

  throw new Error(
    "Gemini API: All retries exhausted. Your free tier quota may be used up. " +
    "Generate a new API key in a NEW project at https://aistudio.google.com"
  );
}

export async function* streamGemini(prompt: string): AsyncGenerator<string, void, unknown> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to your .env.local file.");
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    const status = error?.status || error?.code;
    const message = error?.message || "Unknown error";
    
    console.error(`[Gemini Stream] FAILED — status: ${status}`);
    console.error(`[Gemini Stream] Error: ${message.substring(0, 300)}`);

    if (status === 429) {
      throw new Error(
        "Gemini API rate limit exceeded. Your free tier quota is exhausted. " +
        "Please generate a new API key in a NEW Google Cloud project at https://aistudio.google.com, " +
        "or wait a few minutes and try again."
      );
    }
    
    if (status === 403) {
      throw new Error(
        "Gemini API key is invalid or disabled. " +
        "Please generate a new key at https://aistudio.google.com"
      );
    }
    
    throw new Error(`Gemini API error (${status}): ${message.substring(0, 200)}`);
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });

    if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
        throw new Error("Embedding API returned empty or malformed vector array.");
    }
    
    return response.embeddings[0].values;
  } catch (error: any) {
    console.error(`[Gemini Embedding] FAILED:`, error?.message || error);
    throw new Error("Failed to generate contextual vector.");
  }
}