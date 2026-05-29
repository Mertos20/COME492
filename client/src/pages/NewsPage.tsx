import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { NewsItem } from "../types";
import { Alert, Box, Button, Card, CardActionArea, CardContent, CardMedia, CircularProgress, Chip, Grid, Stack, TextField, Typography } from "@mui/material";
import { Article, Language, Search } from "@mui/icons-material";

interface NewsResponse { source: "cache" | "live"; items: NewsItem[]; warning?: string; providerErrors?: string[]; }

const formatDate = (value: string): string =>
  new Date(value).toLocaleString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function NewsPage() {
  const [scope, setScope] = useState<"tr" | "global">("tr");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [query, setQuery] = useState("finance OR economy OR market OR borsa OR crypto");
  const [searchInput, setSearchInput] = useState(query);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true); setError(null); setWarning(null);
      try {
        const params = new URLSearchParams({ q: query, scope, limit: "10" });
        const res = await api.get<NewsResponse>(`/news/finance?${params.toString()}`);
        setNews(res.data.items);
        if (res.data.warning) {
          const details = (res.data.providerErrors || []).slice(0, 2).join(" | ");
          setWarning(details ? `${res.data.warning} (${details})` : res.data.warning);
        }
      } catch { setError("Finans haberleri yuklenemedi."); }
      finally { setLoading(false); }
    };
    loadNews();
  }, [query, scope]);

  const hasNews = useMemo(() => news.length > 0, [news]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        p: 3, mb: 3, borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(59,130,246,0.15)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Article sx={{ color: '#3b82f6', fontSize: 28 }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Finans Haberleri</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
          Borsa, kripto, emtia ve makro ekonomi başlıklarında güncel haber akışını takip edin.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {[{ v: "tr" as const, l: "🇹🇷 Türkçe", dq: "finance OR economy OR market OR borsa OR crypto" },
            { v: "global" as const, l: "🌍 Yabancı", dq: "finance OR economy OR market OR stocks OR crypto" }
          ].map(s => (
            <Chip key={s.v} label={s.l} clickable
              onClick={() => { setScope(s.v); setQuery(s.dq); setSearchInput(s.dq); }}
              sx={{
                fontWeight: 600,
                background: scope === s.v ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.03)',
                color: scope === s.v ? '#00d4ff' : 'text.secondary',
                border: `1px solid ${scope === s.v ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                '&:hover': { background: 'rgba(0,212,255,0.08)' },
              }} />
          ))}
        </Stack>

       
      </Box>

      {warning && !loading && <Alert severity="warning" sx={{ mb: 2 }}>{warning}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !hasNews ? (
        <Alert severity="info">Bu filtreye uygun haber bulunamadı.</Alert>
      ) : (
        <Grid container spacing={2}>
          {news.map((item, index) => (
            <Grid xs={12} md={6} lg={4} key={`${item.url}-${item.publishedAt}`}>
              <Card elevation={0} sx={{
                height: "100%",
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                animation: 'slideUp 0.5s ease-out forwards',
                animationDelay: `${index * 0.06}s`, opacity: 0,
                '&:hover': {
                  borderColor: 'rgba(0,212,255,0.2)',
                  '& .news-image': { transform: 'scale(1.05)' },
                },
              }}>
                <CardActionArea component="a" href={item.url} target="_blank" rel="noopener noreferrer" sx={{ height: "100%", display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                  {item.imageUrl && (
                    <Box sx={{ overflow: 'hidden' }}>
                      <CardMedia component="img" image={item.imageUrl} alt={item.title} className="news-image"
                        sx={{ height: 180, objectFit: "cover", transition: 'transform 0.4s ease' }} />
                    </Box>
                  )}
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" sx={{ mb: 1, justifyContent: "space-between", alignItems: "center" }}>
                      <Chip size="small" label={item.source} sx={{
                        fontSize: '0.6rem', height: 20, fontWeight: 600,
                        background: 'rgba(0,212,255,0.08)', color: '#00d4ff',
                        border: '1px solid rgba(0,212,255,0.15)',
                      }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>{formatDate(item.publishedAt)}</Typography>
                    </Stack>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.4, color: 'text.primary' }}>{item.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.summary}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

