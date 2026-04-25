import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { NewsItem } from "../types";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography
} from "@mui/material";

interface NewsResponse {
  source: "cache" | "live";
  items: NewsItem[];
  warning?: string;
  providerErrors?: string[];
}

const formatDate = (value: string): string => {
  return new Date(value).toLocaleString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

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
      setLoading(true);
      setError(null);
      setWarning(null);
      try {
        const params = new URLSearchParams({ q: query, scope, limit: "10" });
        const res = await api.get<NewsResponse>(`/news/finance?${params.toString()}`);
        setNews(res.data.items);
        if (res.data.warning) {
          const details = (res.data.providerErrors || []).slice(0, 2).join(" | ");
          setWarning(details ? `${res.data.warning} (${details})` : res.data.warning);
        }
      } catch {
        setError("Finans haberleri yuklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [query, scope]);

  const hasNews = useMemo(() => news.length > 0, [news]);

  return (
    <Box>
      <Box
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(130deg, #f8fbff 0%, #eef6ff 100%)"
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Finans Haberleri
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Borsa, kripto, emtia ve makro ekonomi basliklarinda guncel haber akisini takip edin.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Chip
            label="Turkce"
            clickable
            color={scope === "tr" ? "primary" : "default"}
            variant={scope === "tr" ? "filled" : "outlined"}
            onClick={() => {
              const defaultQuery = "finance OR economy OR market OR borsa OR crypto";
              setScope("tr");
              setQuery(defaultQuery);
              setSearchInput(defaultQuery);
            }}
          />
          <Chip
            label="Yabanci"
            clickable
            color={scope === "global" ? "primary" : "default"}
            variant={scope === "global" ? "filled" : "outlined"}
            onClick={() => {
              const defaultQuery = "finance OR economy OR market OR stocks OR crypto";
              setScope("global");
              setQuery(defaultQuery);
              setSearchInput(defaultQuery);
            }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={scope === "global" ? "Ornek: fed OR inflation OR bitcoin" : "Ornek: borsa OR faiz OR bitcoin"}
            size="small"
          />
          <Chip
            label="Yenile"
            color="primary"
            clickable
            onClick={() => setQuery(searchInput.trim() || (scope === "global"
              ? "finance OR economy OR market OR stocks OR crypto"
              : "finance OR economy OR market OR borsa OR crypto"))}
            sx={{ px: 1.5, height: 40, fontWeight: 700 }}
          />
        </Stack>
      </Box>

      {warning && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {warning}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !hasNews ? (
        <Alert severity="info">Bu filtreye uygun haber bulunamadi.</Alert>
      ) : (
        <Grid container spacing={2}>
          {news.map((item) => (
            <Grid xs={12} md={6} lg={4} key={`${item.url}-${item.publishedAt}`}>
              <Card sx={{ height: "100%", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                <CardActionArea
                  component="a"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ height: "100%", alignItems: "stretch" }}
                >
                  {item.imageUrl && (
                    <CardMedia
                      component="img"
                      image={item.imageUrl}
                      alt={item.title}
                      sx={{ height: 180, objectFit: "cover" }}
                    />
                  )}
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Chip size="small" label={item.source} variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.publishedAt)}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700, mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
