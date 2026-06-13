import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = Router();

const getApiKey = (): string | undefined => {
  return process.env.GEMINI_API_KEY?.trim();
};

let genAI: GoogleGenerativeAI | null = null;
const initGenAI = (): GoogleGenerativeAI => {
  if (genAI) return genAI;
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env file");
  }
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};

// Check if user is higher than or equal to a tier
const hasTierAccess = (userTier: string, requiredTier: "free" | "bronze" | "silver" | "gold"): boolean => {
  const levels: Record<string, number> = { free: 0, bronze: 1, silver: 2, gold: 3 };
  return (levels[userTier] || 0) >= (levels[requiredTier] || 0);
};

// Mock premium data generators
const getMockWeeklyReport = () => ({
  title: "Haftalık Makro & Teknik Piyasa Raporu",
  date: "10 Haziran 2026 - 17 Haziran 2026",
  summary: "Bu hafta ABD enflasyon verileri ve merkez bankalarının faiz kararları piyasalarda yüksek oynaklığa sebep olabilir. Altın ons fiyatında 2,350$ seviyesi güçlü destek olarak korunurken, hisse senetlerinde teknoloji ağırlıklı realizasyonlar gözlenebilir. Portföylerde likit koruma oranının artırılması önerilmektedir.",
  highlights: [
    "Gram Altın: Kur ve ons desteği ile yatay pozitif trend devam ediyor.",
    "Borsa İstanbul: 10,200 direnci aşılırsa yeni zirveler hedeflenebilir.",
    "Kripto Para: Bitcoin 68,000$ direncini kırmaya çalışıyor, altcoinlerde hacimsiz seyir hakim."
  ]
});

const getMockDailyReport = () => ({
  title: "Günlük Piyasa Değerlendirmesi",
  date: "10 Haziran 2026",
  summary: "Güne Asya piyasalarındaki alıcılı seyirle başlıyoruz. Dolar endeksi (DXY) 104.2 seviyesinde dengelenirken, emtia grubunda petrol fiyatlarında hafif geri çekilmeler mevcut. Bugün yurt içinde ödemeler dengesi verileri takip edilecek.",
  bullets: [
    "Dolar/TL: 32.45 seviyesinde sakin başlangıç.",
    "Ethereum: Günlük %2.4 artışla 3,550$ seviyesini test ediyor.",
    "Gümüş: Ons başına 29.80$ direncinde kar satışları gözleniyor."
  ]
});

const getMockBasicSignals = () => [
  { symbol: "GRAM_ALTIN", signal: "AL", strength: "Orta", indicator: "MA(20) Üzerinde" },
  { symbol: "BTC", signal: "GÜÇLÜ AL", strength: "Yüksek", indicator: "RSI(14) Boğa Bölgesi" },
  { symbol: "USDTRY", signal: "TUT", strength: "Zayıf", indicator: "Bollinger Band Orta Noktası" },
  { symbol: "XAUUSD", signal: "AL", strength: "Orta", indicator: "MACD Kesişimi Pozitif" }
];

const getMockDetailedSignals = () => [
  { symbol: "GRAM_ALTIN", support: "2,420 / 2,390", resistance: "2,480 / 2,510", rsi: 58, macd: "Boğa Kesişimi", signal: "AL" },
  { symbol: "BTC", support: "66,500 / 64,200", resistance: "69,800 / 72,000", rsi: 65, macd: "Yukarı Yönlü Hızlanma", signal: "GÜÇLÜ AL" },
  { symbol: "USDTRY", support: "32.20 / 32.00", resistance: "32.65 / 32.80", rsi: 51, macd: "Nötr", signal: "TUT" },
  { symbol: "XAUUSD", support: "2,320 / 2,290", resistance: "2,385 / 2,420", rsi: 55, macd: "Nötr-Pozitif", signal: "AL" }
];

const getMockSpecialRecommendations = () => [
  { title: "Defansif Altın Akümülasyonu", desc: "Jeopolitik risklerin artması ihtimaline karşın portföyün %20'sinin Gram Altın veya Ons Altında tutulması, kur korumalı bir getiri hedge'i sağlayacaktır." },
  { title: "Kripto Kar Alımı & Stabilizasyon", desc: "Kripto varlıklarda son 30 günlük hızlı yükselişin ardından, kârların %15'inin USDT veya benzeri sabit coinlere geçirilerek olası geri çekilmelerde alım fırsatı kollanması önerilir." }
];

const getMockComprehensiveAnalysis = () => ({
  orderFlow: "Kurumsal fonların altın ve ABD tahvillerine para girişi son 10 günde %14 arttı. Perakende yatırımcı ise kripto paralarda uzun (long) pozisyonları ağırlıklandırıyor.",
  heatmapData: {
    forex: "+0.15%",
    crypto: "+3.42%",
    preciousMetals: "+0.85%",
    bonds: "-0.05%"
  },
  correlations: [
    { pair: "BTC / Ons Altın", value: "0.42 (Orta Pozitif)" },
    { pair: "Ons Altın / DXY", value: "-0.78 (Güçlü Negatif)" },
    { pair: "BTC / DXY", value: "-0.65 (Güçlü Negatif)" }
  ]
});

// GET /api/analysis/reports
router.get("/reports", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Yetkilendirilmis" });
  }

  const membership = user.membership;

  const data: any = {
    membership,
    weeklyReport: null,
    basicSignals: null,
    dailyReport: null,
    detailedSignals: null,
    specialRecommendations: null,
    comprehensiveAnalysis: null,
  };

  // Bronze & above: Unlocks Weekly Report and Basic Signals
  if (hasTierAccess(membership, "bronze")) {
    data.weeklyReport = getMockWeeklyReport();
    data.basicSignals = getMockBasicSignals();
  }

  // Silver & above: Unlocks Daily Report, Detailed Signals, Special Recommendations
  if (hasTierAccess(membership, "silver")) {
    data.dailyReport = getMockDailyReport();
    data.detailedSignals = getMockDetailedSignals();
    data.specialRecommendations = getMockSpecialRecommendations();
  }

  // Gold only: Unlocks Comprehensive Analysis
  if (hasTierAccess(membership, "gold")) {
    data.comprehensiveAnalysis = getMockComprehensiveAnalysis();
  }

  res.json(data);
});

// POST /api/analysis/strategy
router.post("/strategy", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Yetkilendirilmis" });
    }

    // Gold restriction check
    if (!hasTierAccess(user.membership, "gold") && !user.isAdmin) {
      return res.status(403).json({
        message: "Kişiselleştirilmiş yatırım stratejisi oluşturucu sadece GOLD üyelerimize özeldir."
      });
    }

    const { budget, risk, duration } = req.body as {
      budget: number;
      risk: "conservative" | "moderate" | "aggressive";
      duration: string;
    };

    if (!budget || !risk || !duration) {
      return res.status(400).json({ message: "Lütfen bütçe, risk düzeyi ve yatırım süresi bilgilerini eksiksiz doldurun." });
    }

    // Initialize Gemini AI
    let genAIInstance: GoogleGenerativeAI;
    try {
      genAIInstance = initGenAI();
    } catch (err) {
      return res.status(500).json({
        message: "Gemini API konfigürasyonu eksik. Lütfen sunucu yöneticisine başvurun."
      });
    }

    const systemPrompt = `Sen portfol.io platformunda hizmet veren üst düzey bir yapay zeka yatırım danışmanısın. Gold üyelerimize kişiye özel portföy dağıtımları hazırlıyorsun.
Sana verilen bütçe, yatırım süresi ve risk toleransı doğrultusunda dengeli, profesyonel ve yüzdesel dağılım içeren bir yatırım planı çıkar.

Kurallar:
1. Türkçe ve akıcı, profesyonel bir tonda yaz.
2. Varlık dağılımını (örneğin Hisse Senetleri %X, Değerli Metaller %Y, Kripto Para %Z, Likit/Mevduat %W) net başlıklar altında ver.
3. Her varlık grubu için seçilme sebebini kısaca açıkla.
4. "Finansal tavsiye niteliğinde değildir, genel bilgilendirme içerir" risk uyarısını muhakkak ekle.
5. Toplam yüzdelerin %100'e eşit olmasını sağla.
6. Yanıtını markdown formatında düzenli ve okunabilir şekilde sun.`;

    const model = genAIInstance.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const riskTranslation = {
      conservative: "Düşük Risk (Defansif / Anapara Korumalı)",
      moderate: "Orta Risk (Dengeli Getiri)",
      aggressive: "Yüksek Risk (Agresif / Büyüme Odaklı)"
    };

    const promptMessage = `Bütçe: ${budget} TRY
Yatırım Süresi: ${duration}
Risk Profilim: ${riskTranslation[risk] || risk}

Lütfen yukarıdaki bilgiler doğrultusunda bana özel en uygun yatırım stratejisini oluşturup portföy dağılımını açıklar mısın?`;

    const result = await model.generateContent(promptMessage);
    const text = result.response.text();

    res.json({ strategy: text });
  } catch (error: any) {
    console.error("❌ Gemini Strategy API Error:", error);
    res.status(500).json({
      message: "Yatırım stratejisi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
    });
  }
});

export default router;
