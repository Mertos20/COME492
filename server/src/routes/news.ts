import { Router } from "express";
import { requireAuth } from "../middleware/auth";

interface GNewsArticle {
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  image?: string;
  publishedAt?: string;
  source?: { name?: string };
}

interface NewsItem {
  title: string;
  summary: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  source: string;
}

interface ProviderPayload {
  articles?: GNewsArticle[];
}

interface ProviderAttemptResult {
  ok: boolean;
  status?: number;
  statusText?: string;
  items: NewsItem[];
  details?: string;
}

const router = Router();

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; items: NewsItem[] }>();

const buildCacheKey = (query: string, lang: string, max: number, scope: "tr" | "global"): string => `${query}|${lang}|${max}|${scope}`;

const normalizeArticles = (articles: GNewsArticle[] | undefined): NewsItem[] =>
  (articles || [])
    .filter((article) => Boolean(article.title && article.url && article.publishedAt))
    .map((article) => ({
      title: article.title || "Baslik yok",
      summary: article.description || article.content || "Ozet bulunamadi",
      url: article.url || "#",
      imageUrl: article.image || null,
      publishedAt: article.publishedAt || new Date().toISOString(),
      source: article.source?.name || "Bilinmeyen kaynak"
    }));

const fetchProvider = async (url: string): Promise<ProviderAttemptResult> => {
  const response = await fetch(url);
  if (!response.ok) {
    const details = await response.text();
    return {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      details,
      items: []
    };
  }

  const payload = (await response.json()) as ProviderPayload;
  return {
    ok: true,
    status: response.status,
    statusText: response.statusText,
    items: normalizeArticles(payload.articles)
  };
};

const isActivationError = (text: string): boolean => {
  const normalized = text.toLowerCase();
  return normalized.includes("activate your account") || normalized.includes("verify your email");
};

router.get("/finance", requireAuth, async (req, res) => {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: "GNEWS_API_KEY tanimli degil" });
      return;
    }

    const scope = (req.query.scope as "tr" | "global") || "tr";
    const lang = scope === "global" ? "en" : "tr";
    const country = scope === "global" ? "us" : "tr";
    // Free GNews plans typically support up to 10 items per request.
    const requestedLimit = Number(req.query.limit || 10);
    const max = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 10) : 10;
    const query = (req.query.q as string) || (scope === "global"
      ? "finance OR economy OR market OR stocks OR crypto"
      : "ekonomi OR finans OR borsa OR kripto OR yatırım");
    const cacheKey = buildCacheKey(query, lang, max, scope);
    const now = Date.now();

    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      res.json({ source: "cache", items: cached.items });
      return;
    }

    const searchParams = new URLSearchParams({
      q: query,
      lang,
      max: String(max),
      sortby: "publishedAt",
      token: apiKey
    });

    const fallbackSearch = new URLSearchParams({
      q: scope === "global" ? "finance" : "ekonomi",
      lang,
      max: String(max),
      sortby: "publishedAt",
      token: apiKey
    });

    const fallbackHeadlineParams = new URLSearchParams({
      category: "business",
      lang,
      max: String(max),
      token: apiKey
    });
    const fallbackCountryParams = new URLSearchParams({
      category: "business",
      country,
      max: String(max),
      token: apiKey
    });

    const attempts = [
      { label: "search(query)", url: `https://gnews.io/api/v4/search?${searchParams.toString()}` },
      { label: "search(fallback)", url: `https://gnews.io/api/v4/search?${fallbackSearch.toString()}` },
      { label: "top-headlines(lang)", url: `https://gnews.io/api/v4/top-headlines?${fallbackHeadlineParams.toString()}` },
      { label: "top-headlines(country)", url: `https://gnews.io/api/v4/top-headlines?${fallbackCountryParams.toString()}` }
    ];

    let items: NewsItem[] = [];
    const providerErrors: string[] = [];
    let activationRequired = false;
    for (const attempt of attempts) {
      const result = await fetchProvider(attempt.url);
      if (result.ok && result.items.length > 0) {
        items = result.items;
        break;
      }

      if (!result.ok) {
        const detail = (result.details || "").slice(0, 180);
        if (isActivationError(detail)) {
          activationRequired = true;
        }
        providerErrors.push(`${attempt.label} -> ${result.status || "?"} ${result.statusText || ""} ${detail}`.trim());
      }
    }

    cache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, items });
    if (items.length === 0) {
      if (activationRequired) {
        res.json({
          source: "live",
          items,
          warning: "GNews hesabi aktif degil. Lutfen GNews e-posta dogrulamasini tamamlayip tekrar deneyin.",
          providerErrors
        });
        return;
      }

      res.json({
        source: "live",
        items,
        warning: "Haber saglayici su anda veri dondurmedi.",
        providerErrors
      });
      return;
    }

    res.json({ source: "live", items });
  } catch (error) {
    res.status(500).json({ message: "Haberler alinamadi", error: (error as Error).message });
  }
});

export default router;
