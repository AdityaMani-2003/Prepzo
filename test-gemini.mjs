// Use raw fetch to list models and test them
const apiKey = "AIzaSyBbXLPpb41GHQOspOuZVSaAjgs6ckhZa3o";
const fs = await import("fs");

// 1. List available models
const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
const listData = await listRes.json();

const genModels = (listData.models || [])
  .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
  .map(m => m.name.replace("models/", ""));

let output = "Available models:\n" + genModels.join("\n") + "\n\n";

// 2. Test each model
for (const model of genModels.slice(0, 5)) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Say hello." }] }] })
      }
    );
    const data = await res.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      output += `${model}: SUCCESS - ${data.candidates[0].content.parts[0].text.trim()}\n`;
    } else {
      output += `${model}: FAILED - ${JSON.stringify(data.error || data).substring(0, 200)}\n`;
    }
  } catch (e) {
    output += `${model}: ERROR - ${e.message}\n`;
  }
}

fs.writeFileSync("test-result.txt", output);
console.log("Done.");
