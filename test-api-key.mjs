import fs from 'fs';
import path from 'path';

// Read .env file
const envPath = path.join(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envFile.match(/(?:GEMINI_API_KEY|GOOGLE_AI_API_KEY)=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
  console.error("❌ API key not found in .env");
  process.exit(1);
}

console.log("Found API Key! Testing connection to Gemini API...");

async function testKey() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Hello, this is a connection test. Please reply with the exact word: 'SUCCESS'." }] }]
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("✅ Success! The key is valid and working.");
      console.log("🤖 Gemini API response:", text.trim());
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
