import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function testStream() {
  console.log("Testing stream connection natively...");
  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: "Ask me a react question",
    });
    
    for await (const chunk of responseStream) {
      process.stdout.write(chunk.text || "");
    }
    console.log("\n[SUCCESS] Stream connection verified.");
  } catch (err) {
    console.error("\n[ERROR] Stream failed:", err.message);
  }
}
testStream();
