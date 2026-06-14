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
const getMockWeeklyReport = (lang: string) => {
  if (lang === 'en') {
    return {
      title: "Weekly Macro & Technical Market Report",
      date: "June 10, 2026 - June 17, 2026",
      summary: "This week, US inflation data and central bank interest rate decisions could cause high volatility in the markets. While the $2,350 level for gold remains a strong support, technology-heavy realizations can be observed in equities. It is recommended to increase the liquid protection ratio in portfolios.",
      highlights: [
        "Gram Gold: The horizontal positive trend continues with exchange rate and ounce support.",
        "Borsa Istanbul: If the 10,200 resistance is breached, new highs can be targeted.",
        "Crypto: Bitcoin is trying to break the $68,000 resistance, a volumeless trend prevails in altcoins."
      ]
    };
  }
  return {
    title: "Haftalık Makro & Teknik Piyasa Raporu",
    date: "10 Haziran 2026 - 17 Haziran 2026",
    summary: "Bu hafta ABD enflasyon verileri ve merkez bankalarının faiz kararları piyasalarda yüksek oynaklığa sebep olabilir. Altın ons fiyatında 2,350$ seviyesi güçlü destek olarak korunurken, hisse senetlerinde teknoloji ağırlıklı realizasyonlar gözlenebilir. Portföylerde likit koruma oranının artırılması önerilmektedir.",
    highlights: [
      "Gram Altın: Kur ve ons desteği ile yatay pozitif trend devam ediyor.",
      "Borsa İstanbul: 10,200 direnci aşılırsa yeni zirveler hedeflenebilir.",
      "Kripto Para: Bitcoin 68,000$ direncini kırmaya çalışıyor, altcoinlerde hacimsiz seyir hakim."
    ]
  };
};

const getMockDailyReport = (lang: string) => {
  if (lang === 'en') {
    return {
      title: "Daily Market Review",
      date: "June 10, 2026",
      summary: "We start the day with a buying trend in Asian markets. While the dollar index (DXY) balanced at 104.2, there are slight pullbacks in oil prices in the commodity group. Domestically, the balance of payments data will be monitored today.",
      bullets: [
        "USD/TRY: Calm start at 32.45 level.",
        "Ethereum: Testing the $3,550 level with a 2.4% daily increase.",
        "Silver: Profit taking is observed at the $29.80 per ounce resistance."
      ]
    };
  }
  return {
    title: "Günlük Piyasa Değerlendirmesi",
    date: "10 Haziran 2026",
    summary: "Güne Asya piyasalarındaki alıcılı seyirle başlıyoruz. Dolar endeksi (DXY) 104.2 seviyesinde dengelenirken, emtia grubunda petrol fiyatlarında hafif geri çekilmeler mevcut. Bugün yurt içinde ödemeler dengesi verileri takip edilecek.",
    bullets: [
      "Dolar/TL: 32.45 seviyesinde sakin başlangıç.",
      "Ethereum: Günlük %2.4 artışla 3,550$ seviyesini test ediyor.",
      "Gümüş: Ons başına 29.80$ direncinde kar satışları gözleniyor."
    ]
  };
};

const getMockBasicSignals = (lang: string) => {
  if (lang === 'en') {
    return [
      { symbol: "GRAM_GOLD", signal: "BUY", strength: "Medium", indicator: "Above MA(20)" },
      { symbol: "BTC", signal: "STRONG BUY", strength: "High", indicator: "RSI(14) Bull Zone" },
      { symbol: "USDTRY", signal: "HOLD", strength: "Weak", indicator: "Bollinger Band Midpoint" },
      { symbol: "XAUUSD", signal: "BUY", strength: "Medium", indicator: "MACD Cross Positive" }
    ];
  }
  return [
    { symbol: "GRAM_ALTIN", signal: "AL", strength: "Orta", indicator: "MA(20) Üzerinde" },
    { symbol: "BTC", signal: "GÜÇLÜ AL", strength: "Yüksek", indicator: "RSI(14) Boğa Bölgesi" },
    { symbol: "USDTRY", signal: "TUT", strength: "Zayıf", indicator: "Bollinger Band Orta Noktası" },
    { symbol: "XAUUSD", signal: "AL", strength: "Orta", indicator: "MACD Kesişimi Pozitif" }
  ];
};

const getMockDetailedSignals = (lang: string) => {
  if (lang === 'en') {
    return [
      { symbol: "GRAM_GOLD", support: "2,420 / 2,390", resistance: "2,480 / 2,510", rsi: 58, macd: "Bull Cross", signal: "BUY" },
      { symbol: "BTC", support: "66,500 / 64,200", resistance: "69,800 / 72,000", rsi: 65, macd: "Upward Acceleration", signal: "STRONG BUY" },
      { symbol: "USDTRY", support: "32.20 / 32.00", resistance: "32.65 / 32.80", rsi: 51, macd: "Neutral", signal: "HOLD" },
      { symbol: "XAUUSD", support: "2,320 / 2,290", resistance: "2,385 / 2,420", rsi: 55, macd: "Neutral-Positive", signal: "BUY" }
    ];
  }
  return [
    { symbol: "GRAM_ALTIN", support: "2,420 / 2,390", resistance: "2,480 / 2,510", rsi: 58, macd: "Boğa Kesişimi", signal: "AL" },
    { symbol: "BTC", support: "66,500 / 64,200", resistance: "69,800 / 72,000", rsi: 65, macd: "Yukarı Yönlü Hızlanma", signal: "GÜÇLÜ AL" },
    { symbol: "USDTRY", support: "32.20 / 32.00", resistance: "32.65 / 32.80", rsi: 51, macd: "Nötr", signal: "TUT" },
    { symbol: "XAUUSD", support: "2,320 / 2,290", resistance: "2,385 / 2,420", rsi: 55, macd: "Nötr-Pozitif", signal: "AL" }
  ];
};

const getMockSpecialRecommendations = (lang: string) => {
  if (lang === 'en') {
    return [
      { title: "Defensive Gold Accumulation", desc: "Against the possibility of increased geopolitical risks, holding 20% of the portfolio in Gram Gold or Ounce Gold will provide an exchange rate protected return hedge." },
      { title: "Crypto Profit Taking & Stabilization", desc: "Following the rapid rise in crypto assets over the last 30 days, it is recommended to move 15% of the profits to USDT or similar stable coins and look for buying opportunities in possible pullbacks." }
    ];
  }
  return [
    { title: "Defansif Altın Akümülasyonu", desc: "Jeopolitik risklerin artması ihtimaline karşın portföyün %20'sinin Gram Altın veya Ons Altında tutulması, kur korumalı bir getiri hedge'i sağlayacaktır." },
    { title: "Kripto Kar Alımı & Stabilizasyon", desc: "Kripto varlıklarda son 30 günlük hızlı yükselişin ardından, kârların %15'inin USDT veya benzeri sabit coinlere geçirilerek olası geri çekilmelerde alım fırsatı kollanması önerilir." }
  ];
};

const getMockComprehensiveAnalysis = (lang: string) => {
  if (lang === 'en') {
    return {
      orderFlow: "Institutional fund inflows to gold and US treasuries increased by 14% in the last 10 days. Retail investors, on the other hand, are weighting long positions in cryptocurrencies.",
      heatmapData: {
        forex: "+0.15%",
        crypto: "+3.42%",
        preciousMetals: "+0.85%",
        bonds: "-0.05%"
      },
      correlations: [
        { pair: "BTC / Ounce Gold", value: "0.42 (Moderate Positive)" },
        { pair: "Ounce Gold / DXY", value: "-0.78 (Strong Negative)" },
        { pair: "BTC / DXY", value: "-0.65 (Strong Negative)" }
      ]
    };
  }
  return {
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
  };
};

// GET /api/analysis/reports
router.get("/reports", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Yetkilendirilmis" });
  }

  const membership = user.membership;
  const lang = req.headers["accept-language"]?.startsWith("en") ? "en" : "tr";

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
    data.weeklyReport = getMockWeeklyReport(lang);
    data.basicSignals = getMockBasicSignals(lang);
  }

  // Silver & above: Unlocks Daily Report, Detailed Signals, Special Recommendations
  if (hasTierAccess(membership, "silver")) {
    data.dailyReport = getMockDailyReport(lang);
    data.detailedSignals = getMockDetailedSignals(lang);
    data.specialRecommendations = getMockSpecialRecommendations(lang);
  }

  // Gold only: Unlocks Comprehensive Analysis
  if (hasTierAccess(membership, "gold")) {
    data.comprehensiveAnalysis = getMockComprehensiveAnalysis(lang);
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

    const lang = req.headers["accept-language"]?.startsWith("en") ? "en" : "tr";

    // Gold restriction check
    if (!hasTierAccess(user.membership, "gold") && !user.isAdmin) {
      const msg = lang === 'en' 
        ? "The personalized investment strategy builder is exclusive to our GOLD members."
        : "Kişiselleştirilmiş yatırım stratejisi oluşturucu sadece GOLD üyelerimize özeldir.";
      return res.status(403).json({ message: msg });
    }

    const { budget, risk, duration } = req.body as {
      budget: number;
      risk: "conservative" | "moderate" | "aggressive";
      duration: string;
    };

    if (!budget || !risk || !duration) {
      const msg = lang === 'en'
        ? "Please fill in the budget, risk level, and investment duration completely."
        : "Lütfen bütçe, risk düzeyi ve yatırım süresi bilgilerini eksiksiz doldurun.";
      return res.status(400).json({ message: msg });
    }

    // Initialize Gemini AI
    let genAIInstance: GoogleGenerativeAI;
    try {
      genAIInstance = initGenAI();
    } catch (err) {
      const msg = lang === 'en'
        ? "Gemini API configuration is missing. Please contact the server administrator."
        : "Gemini API konfigürasyonu eksik. Lütfen sunucu yöneticisine başvurun.";
      return res.status(500).json({ message: msg });
    }

    const systemPromptTr = `Sen portfol.io platformunda hizmet veren üst düzey bir yapay zeka yatırım danışmanısın. Gold üyelerimize kişiye özel portföy dağıtımları hazırlıyorsun.
Sana verilen bütçe, yatırım süresi ve risk toleransı doğrultusunda dengeli, profesyonel ve yüzdesel dağılım içeren bir yatırım planı çıkar.

Kurallar:
1. Türkçe ve akıcı, profesyonel bir tonda yaz.
2. Varlık dağılımını (örneğin Hisse Senetleri %X, Değerli Metaller %Y, Kripto Para %Z, Likit/Mevduat %W) net başlıklar altında ver.
3. Her varlık grubu için seçilme sebebini kısaca açıkla.
4. "Finansal tavsiye niteliğinde değildir, genel bilgilendirme içerir" risk uyarısını muhakkak ekle.
5. Toplam yüzdelerin %100'e eşit olmasını sağla.
6. Yanıtını markdown formatında düzenli ve okunabilir şekilde sun.`;

    const systemPromptEn = `You are a top-tier AI investment advisor working on the portfol.io platform. You prepare personalized portfolio allocations for our Gold members.
Based on the provided budget, investment duration, and risk tolerance, create a balanced, professional investment plan including a percentage allocation.

Rules:
1. Write in English with a fluent and professional tone.
2. Provide asset allocation under clear headings (e.g., Equities X%, Precious Metals Y%, Cryptocurrencies Z%, Liquid/Deposits W%).
3. Briefly explain the reason for selecting each asset class.
4. Make sure to add the risk warning: "This is not financial advice, it is for general information purposes."
5. Ensure that the total percentages equal 100%.
6. Present your answer in a neat and readable format using markdown.`;

    const model = genAIInstance.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: lang === 'en' ? systemPromptEn : systemPromptTr,
    });

    const riskTranslation: any = {
      tr: {
        conservative: "Düşük Risk (Defansif / Anapara Korumalı)",
        moderate: "Orta Risk (Dengeli Getiri)",
        aggressive: "Yüksek Risk (Agresif / Büyüme Odaklı)"
      },
      en: {
        conservative: "Low Risk (Defensive / Capital Protected)",
        moderate: "Medium Risk (Balanced Return)",
        aggressive: "High Risk (Aggressive / Growth Oriented)"
      }
    };

    const promptMessage = lang === 'en'
      ? `Budget: ${budget} TRY\nInvestment Duration: ${duration}\nRisk Profile: ${riskTranslation.en[risk] || risk}\n\nPlease create the most suitable personalized investment strategy for me based on the information above and explain the portfolio allocation.`
      : `Bütçe: ${budget} TRY\nYatırım Süresi: ${duration}\nRisk Profilim: ${riskTranslation.tr[risk] || risk}\n\nLütfen yukarıdaki bilgiler doğrultusunda bana özel en uygun yatırım stratejisini oluşturup portföy dağılımını açıklar mısın?`;

    const result = await model.generateContent(promptMessage);
    const text = result.response.text();

    res.json({ strategy: text });
  } catch (error: any) {
    console.error("❌ Gemini Strategy API Error:", error);
    const lang = req.headers["accept-language"]?.startsWith("en") ? "en" : "tr";
    const msg = lang === 'en'
      ? "An error occurred while generating the investment strategy. Please try again."
      : "Yatırım stratejisi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.";
    res.status(500).json({ message: msg });
  }
});

export default router;
