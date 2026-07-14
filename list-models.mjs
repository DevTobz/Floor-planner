import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envFile.match(/(?:GEMINI_API_KEY|GOOGLE_AI_API_KEY)=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();
    console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
  } catch (e) {
    console.error(e);
  }
}

listModels();
