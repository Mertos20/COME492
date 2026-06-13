import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { NewsItem } from "../types";
import { Alert, Box, Button, Card, CardActionArea, CardContent, CardMedia, CardActions, CircularProgress, Chip, Grid, Stack, TextField, Typography } from "@mui/material";
import { Article, Language, Search, AutoFixHigh, TrendingUp, TrendingDown, Remove } from "@mui/icons-material";

interface NewsResponse { source: "cache" | "live"; items: NewsItem[]; warning?: string; providerErrors?: string[]; }

const formatDate = (value: string): string =>
  new Date(value).toLocaleString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [query, setQuery] = useState("ekonomi OR finans OR borsa OR kripto OR yatırım");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [sentiments, setSentiments] = useState<Record<string, { loading: boolean; result?: "POZİTİF" | "NEGATİF" | "NÖTR" }>>({});

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true); setError(null); setWarning(null);
      try {
        const params = new URLSearchParams({ q: query, scope: "global", limit: "10" });
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
  }, [query]);

  const hasNews = useMemo(() => news.length > 0, [news]);

  const analyzeNews = async (item: NewsItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const key = `${item.url}-${item.publishedAt}`;
    setSentiments(prev => ({ ...prev, [key]: { loading: true } }));
    
    try {
      const res = await api.post("/ai/analyze-news", { title: item.title, summary: item.summary });
      setSentiments(prev => ({ ...prev, [key]: { loading: false, result: res.data.sentiment } }));
    } catch (err) {
      console.error(err);
      setSentiments(prev => ({ ...prev, [key]: { loading: false, result: "NÖTR" } }));
    }
  };

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
            <Grid xs={12} md={6} lg={4} key={`${item.url}-${item.publishedAt}`} sx={{ display: 'flex' }}>
              <Card elevation={0} sx={{
                width: '100%',
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                animation: 'slideUp 0.5s ease-out forwards',
                animationDelay: `${index * 0.06}s`, opacity: 0,
                '&:hover': {
                  borderColor: 'rgba(0,212,255,0.2)',
                  '& .news-image': { transform: 'scale(1.05)' },
                },
              }}>
                <CardActionArea component="a" href={item.url} target="_blank" rel="noopener noreferrer" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
                  {item.imageUrl && (
                    <Box sx={{ overflow: 'hidden', width: '100%' }}>
                      <CardMedia component="img" image={item.imageUrl} alt={item.title} className="news-image"
                        sx={{ height: 180, objectFit: "cover", transition: 'transform 0.4s ease' }} />
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1, width: '100%' }}>
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
                <CardActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 1.5, justifyContent: 'space-between' }}>
                  {(() => {
                    const key = `${item.url}-${item.publishedAt}`;
                    const sentiment = sentiments[key];
                    if (sentiment?.loading) {
                      return <CircularProgress size={20} sx={{ color: '#a855f7' }} />;
                    } else if (sentiment?.result) {
                      return (
                        <Chip
                          size="small"
                          icon={sentiment.result === "POZİTİF" ? <TrendingUp /> : sentiment.result === "NEGATİF" ? <TrendingDown /> : <Remove />}
                          label={sentiment.result}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            background: sentiment.result === "POZİTİF" ? 'rgba(16, 185, 129, 0.15)' : sentiment.result === "NEGATİF" ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.1)',
                            color: sentiment.result === "POZİTİF" ? '#10b981' : sentiment.result === "NEGATİF" ? '#ef4444' : 'text.secondary',
                          }}
                        />
                      );
                    }
                    return (
                      <Button
                        size="small"
                        startIcon={<AutoFixHigh fontSize="small" />}
                        onClick={(e) => analyzeNews(item, e)}
                        sx={{
                          fontSize: '0.65rem',
                          color: '#a855f7',
                          background: 'rgba(168, 85, 247, 0.1)',
                          '&:hover': { background: 'rgba(168, 85, 247, 0.2)' }
                        }}
                      >
                        Yapay Zeka Analizi
                      </Button>
                    );
                  })()}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
