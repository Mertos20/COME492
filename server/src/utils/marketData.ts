export type MarketCategory = "forex" | "gold" | "silver" | "crypto";

export interface MarketInstrument {
  symbol: string;
  name: string;
  category: MarketCategory;
  price: number;
  change30d: number;
  history30d: number[];
  popular: boolean;
}

interface CoinGeckoMarket {
  id: string;
  current_price: number;
  price_change_percentage_30d_in_currency?: number;
}

interface ExchangeRatesResponse {
  rates: Record<string, number>;
}

const COINGECKO_BASE = process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3";
const EXCHANGE_RATE_BASE = process.env.EXCHANGE_RATE_BASE_URL || "https://api.exchangerate-api.com/v4/latest";
const CACHE_TTL_MS = 15_000; // 15 seconds for live prices
const HISTORY_TTL = 1000 * 60 * 60; // 1 hour for historical charts

let cachedInstruments: MarketInstrument[] = [];
let cachedAt = 0;
let historyCache: Record<string, { data: number[]; timestamp: number }> = {};

const fallbackSeed: Omit<MarketInstrument, "history30d">[] = [
  { symbol: "BTCUSDT", name: "Bitcoin", category: "crypto", price: 68000, change30d: 5.2, popular: true },
  { symbol: "ETHUSDT", name: "Ethereum", category: "crypto", price: 3500, change30d: 4.1, popular: true },
  { symbol: "SOLUSDT", name: "Solana", category: "crypto", price: 145, change30d: 8.4, popular: false },
  { symbol: "XAUUSD", name: "Ons Altın", category: "gold", price: 2200, change30d: 2.1, popular: true },
  { symbol: "XAGUSD", name: "Ons Gümüş", category: "silver", price: 24.5, change30d: 1.9, popular: true },
  { symbol: "USDTRY", name: "Dolar/TL", category: "forex", price: 37.1, change30d: 1.4, popular: true },
  { symbol: "EURTRY", name: "Euro/TL", category: "forex", price: 40.2, change30d: 0.9, popular: true },
  { symbol: "GBPTRY", name: "Sterlin/TL", category: "forex", price: 47.1, change30d: 1.2, popular: false }
];

function buildFallbackHistory(lastPrice: number, change30d: number, seed: string): number[] {
  const points: number[] = [];
  const firstPrice = lastPrice / (1 + change30d / 100);
  const seedShift = seed.charCodeAt(0) % 5;
  for (let i = 0; i < 30; i += 1) {
    const progress = i / 29;
    const base = firstPrice + (lastPrice - firstPrice) * progress;
    const wave = Math.sin(progress * Math.PI * 4 + seedShift) * (lastPrice * 0.006);
    points.push(Number((base + wave).toFixed(4)));
  }
  return points;
}

const fallbackInstruments: MarketInstrument[] = fallbackSeed.map((item) => ({
  ...item,
  history30d: buildFallbackHistory(item.price, item.change30d, item.symbol)
}));

const normalizeNumber = (value: number | undefined, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  return Number((value as number).toFixed(4));
};

const getCoinGeckoHistory = async (id: string, fallbackPrice: number): Promise<number[]> => {
  const now = Date.now();
  if (historyCache[id] && now - historyCache[id].timestamp < HISTORY_TTL) {
    return historyCache[id].data;
  }
  try {
    const res = await fetch(`${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=30`);
    if (!res.ok) throw new Error("CoinGecko history failed");
    const data = await res.json();
    const prices = data.prices as [number, number][];
    const sampled = prices.filter((_, i) => i % 24 === 0).map(p => normalizeNumber(p[1], fallbackPrice));
    historyCache[id] = { data: sampled, timestamp: now };
    return sampled;
  } catch {
    return buildFallbackHistory(fallbackPrice, 0, id);
  }
};

const getForexHistory = async (symbol: string, basePrice: number): Promise<number[]> => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  const startDate = date.toISOString().split("T")[0];
  let base = "USD";
  if (symbol === "EURTRY") base = "EUR";
  if (symbol === "GBPTRY") base = "GBP";

  const id = `forex_${symbol}`;
  const now = Date.now();
  if (historyCache[id] && now - historyCache[id].timestamp < HISTORY_TTL) {
    return historyCache[id].data;
  }
  try {
    const res = await fetch(`https://api.frankfurter.app/${startDate}..?from=${base}&to=TRY`);
    if (!res.ok) throw new Error("Frankfurter history failed");
    const data = await res.json();
    const prices = Object.values(data.rates).map((r: any) => normalizeNumber(r.TRY, basePrice));
    historyCache[id] = { data: prices, timestamp: now };
    return prices;
  } catch {
    return buildFallbackHistory(basePrice, 0, id);
  }
};

const fetchCoinGecko = async (): Promise<Record<string, CoinGeckoMarket>> => {
  const ids = ["bitcoin", "ethereum", "solana", "tether-gold", "kinesis-silver"];
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids.join(",")}&price_change_percentage=30d`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("CoinGecko verisi alinamadi");
  const data = (await response.json()) as CoinGeckoMarket[];
  return data.reduce<Record<string, CoinGeckoMarket>>((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});
};

const fetchRates = async (): Promise<ExchangeRatesResponse> => {
  const response = await fetch(`${EXCHANGE_RATE_BASE}/USD`);
  if (!response.ok) throw new Error("Exchange rate verisi alinamadi");
  return (await response.json()) as ExchangeRatesResponse;
};

const composeLiveInstruments = async (): Promise<MarketInstrument[]> => {
  const [coinMap, rates] = await Promise.all([fetchCoinGecko(), fetchRates()]);
  const tryRate = rates.rates.TRY || 37;
  const eurRate = rates.rates.EUR || 0.92;
  const gbpRate = rates.rates.GBP || 0.78;

  const btc = coinMap.bitcoin;
  const eth = coinMap.ethereum;
  const sol = coinMap.solana;
  const xau = coinMap["tether-gold"];
  const xag = coinMap["kinesis-silver"];

  const btcPrice = normalizeNumber(btc?.current_price, 68000);
  const ethPrice = normalizeNumber(eth?.current_price, 3500);
  const solPrice = normalizeNumber(sol?.current_price, 145);
  const xauPrice = normalizeNumber(xau?.current_price, 2200);
  const xagPrice = normalizeNumber(xag?.current_price, 24.5);
  const usdtryPrice = normalizeNumber(tryRate, 37);
  const eurtryPrice = normalizeNumber((1 / eurRate) * tryRate, 40);
  const gbptryPrice = normalizeNumber((1 / gbpRate) * tryRate, 47);

  const [
    btcHist, ethHist, solHist, xauHist, xagHist, usdtryHist, eurtryHist, gbptryHist
  ] = await Promise.all([
    getCoinGeckoHistory("bitcoin", btcPrice),
    getCoinGeckoHistory("ethereum", ethPrice),
    getCoinGeckoHistory("solana", solPrice),
    getCoinGeckoHistory("tether-gold", xauPrice),
    getCoinGeckoHistory("kinesis-silver", xagPrice),
    getForexHistory("USDTRY", usdtryPrice),
    getForexHistory("EURTRY", eurtryPrice),
    getForexHistory("GBPTRY", gbptryPrice),
  ]);

  const calcChange = (price: number, hist: number[]) => {
    if (!hist.length || !hist[0]) return 0;
    return normalizeNumber(((price - hist[0]) / hist[0]) * 100, 0);
  };

  return [
    { symbol: "BTCUSDT", name: "Bitcoin", category: "crypto", price: btcPrice, change30d: normalizeNumber(btc?.price_change_percentage_30d_in_currency, 0), popular: true, history30d: btcHist },
    { symbol: "ETHUSDT", name: "Ethereum", category: "crypto", price: ethPrice, change30d: normalizeNumber(eth?.price_change_percentage_30d_in_currency, 0), popular: true, history30d: ethHist },
    { symbol: "SOLUSDT", name: "Solana", category: "crypto", price: solPrice, change30d: normalizeNumber(sol?.price_change_percentage_30d_in_currency, 0), popular: false, history30d: solHist },
    { symbol: "XAUUSD", name: "Ons Altın", category: "gold", price: xauPrice, change30d: normalizeNumber(xau?.price_change_percentage_30d_in_currency, 0), popular: true, history30d: xauHist },
    { symbol: "XAGUSD", name: "Ons Gümüş", category: "silver", price: xagPrice, change30d: normalizeNumber(xag?.price_change_percentage_30d_in_currency, 0), popular: true, history30d: xagHist },
    { symbol: "USDTRY", name: "Dolar/TL", category: "forex", price: usdtryPrice, change30d: calcChange(usdtryPrice, usdtryHist), popular: true, history30d: usdtryHist },
    { symbol: "EURTRY", name: "Euro/TL", category: "forex", price: eurtryPrice, change30d: calcChange(eurtryPrice, eurtryHist), popular: true, history30d: eurtryHist },
    { symbol: "GBPTRY", name: "Sterlin/TL", category: "forex", price: gbptryPrice, change30d: calcChange(gbptryPrice, gbptryHist), popular: false, history30d: gbptryHist }
  ];
};

const withCache = async (): Promise<MarketInstrument[]> => {
  const now = Date.now();
  if (cachedInstruments.length && now - cachedAt < CACHE_TTL_MS) {
    return cachedInstruments;
  }

  try {
    cachedInstruments = await composeLiveInstruments();
    cachedAt = now;
    return cachedInstruments;
  } catch {
    if (!cachedInstruments.length) {
      cachedInstruments = fallbackInstruments;
    }
    return cachedInstruments;
  }
};

export const getAllInstruments = async (): Promise<MarketInstrument[]> => withCache();

export const getPopularInstruments = async (): Promise<MarketInstrument[]> => {
  const instruments = await withCache();
  return instruments.filter((item) => item.popular);
};

export const getBySymbol = async (symbol: string): Promise<MarketInstrument | undefined> => {
  const instruments = await withCache();
  return instruments.find((item) => item.symbol === symbol);
};
