
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || !apiKey.startsWith("AIza")) {
    console.error("❌ GEMINI_API_KEY is not configured in root .env file.");
    console.error("   Please add your API key: GEMINI_API_KEY=AIza...");
    return;
  }

  console.log("API Key found. Listing models...");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = await genAI.listModels();

    console.log("✅ Mevcut Modeller ve Desteklenen Metotlar:\n");

    let foundCompatibleModel = false;
    for await (const m of models) {
      const supportedMethods = m.supportedGenerationMethods.join(", ");
      console.log(`- Model Adı: ${m.name}`);
      console.log(`  - Desteklenen Metotlar: ${supportedMethods}`);
      console.log(`  - Görünen Ad: ${m.displayName}`);
      console.log(`  - Açıklama: ${m.description}\n`);

      if (m.supportedGenerationMethods.includes("generateContent")) {
        foundCompatibleModel = true;
        console.log(`  ✨ BU MODEL UYUMLU! ('generateContent' destekliyor) ✨\n`);
      }
    }

    if (!foundCompatibleModel) {
        console.warn("⚠️ UYARI: Hesabınız için 'generateContent' metodunu destekleyen hiçbir model bulunamadı.");
        console.warn("   Bu durum, API anahtarınızın veya Google Cloud projenizin ayarlarıyla ilgili olabilir.");
    }

  } catch (error) {
    console.error("❌ Modelleri listelerken hata oluştu:", error.message);
  }
}

listModels();
