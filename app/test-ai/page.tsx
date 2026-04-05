import { callGemini } from "@/lib/ai/gemini";

export default async function TestAI() {
  try {
    const response = await callGemini("Say hello in one friendly sentence.");

    return (
      <div style={{ padding: "20px", color: "#ededed" }}>
        <h1>✅ Gemini Test — Working</h1>
        <p style={{ fontSize: "18px", marginTop: "12px" }}>{response}</p>
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <div style={{ padding: "20px", color: "#ff6b6b" }}>
        <h1>❌ Gemini Test — Failed</h1>
        <p style={{ fontSize: "14px", marginTop: "12px" }}>{message}</p>
        <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
          Check the server terminal for full error details.
        </p>
      </div>
    );
  }
}