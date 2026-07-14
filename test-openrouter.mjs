import fs from 'fs';
import path from 'path';

// Read .env file
const envPath = path.join(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envFile.match(/OPENROUTER_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
  console.error("❌ OPENROUTER_API_KEY not found in .env");
  process.exit(1);
}

console.log("Found OpenRouter API Key! Testing connection...");

async function testKey() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "BuildAI Studio"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: "Hello, this is a connection test. Please reply with the exact word: 'SUCCESS'." }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      console.log("✅ Success! The key is valid and working.");
      console.log("🤖 OpenRouter API response:", text.trim());
    } else {
      const errText = await response.text();
      console.error("❌ Connection Failed. API replied with status", response.status);
      console.error("Error details:", errText);
    }
  } catch (error) {
    console.error("❌ Fetch error:", error);
  }
}

testKey();
