require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey || !apiKey.startsWith("AIza")) {
  console.error("❌ GEMINI_API_KEY is not configured in root .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
  try {
    console.log("🔍 Listing available models...\n");
    
    const listResult = await genAI.listModels();
    console.log("Available models:\n");
    
    for await (const model of listResult.models) {
      console.log(`- ${model.name}`);
    }
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

testGemini();
