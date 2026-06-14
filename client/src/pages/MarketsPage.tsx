import { useEffect, useState } from "react";
import type { MarketInstrument } from "../types";
import { api } from "../api";
import { io } from "socket.io-client";
import { Grid, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Chip, IconButton } from "@mui/material";
import { TrendingUp, TrendingDown, BarChart, Star, StarBorder } from "@mui/icons-material";
import ChartModal from "../components/ChartModal";

import { useMarket } from "../contexts/MarketContext";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../contexts/CurrencyContext";

const categoryColors: Record<string, string> = {
  crypto: '#f59e0b',
  forex: '#3b82f6',
  gold: '#ffd700',
  silver: '#c0c0c0',
};

export default function MarketsPage() {
  const { instruments: markets, loading } = useMarket();
  const popular = markets.filter((item) => item.popular);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<MarketInstrument | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await api.get('/portfolio/watchlist');
        setWatchlist(res.data.watchlist || []);
      } catch (err) {
        console.error(t('markets.error_fetch_watchlist'), err);
      }
    };
    fetchWatchlist();
  }, []);

  const toggleWatchlist = async (symbol: string) => {
    try {
      const res = await api.post('/portfolio/watchlist', { symbol });
      setWatchlist(res.data.watchlist || []);
    } catch (err) {
      console.error(t('markets.error_toggle_watchlist'), err);
    }
  };

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>{t('markets.loading')}</Typography></Box>;
  }

  const handleOpenChart = (item: MarketInstrument) => {
    setSelectedChart(item);
    setModalOpen(true);
  };

  return (
    <Box>
      {/* Section Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{t('markets.popular_title')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('markets.popular_subtitle')}</Typography>
      </Box>

      {/* Popular Cards */}
      <Grid container spacing={2} sx={{ mb: 5 }}>
        {popular.map((item, index) => (
          <Grid xs={12} sm={6} md={4} lg={3} key={item.symbol}>
            <Card
              elevation={0}
              sx={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                animation: 'slideUp 0.5s ease-out forwards',
                animationDelay: `${index * 0.08}s`,
                opacity: 0,
                '&:hover': {
                  borderColor: item.change30d >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                  boxShadow: item.change30d >= 0
                    ? '0 0 30px rgba(16, 185, 129, 0.1)'
                    : '0 0 30px rgba(239, 68, 68, 0.1)',
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00d4ff' }}>{item.symbol}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.name}</Typography>
                  </Box>
                  <Chip
                    label={item.category}
                    size="small"
                    sx={{
                      fontSize: '0.6rem',
                      height: 20,
                      background: `${categoryColors[item.category]}15`,
                      color: categoryColors[item.category],
                      border: `1px solid ${categoryColors[item.category]}30`,
                    }}
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  {formatMoney(item.price, ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"].includes(item.symbol) ? "USD" : "TRY")}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: item.change30d >= 0 ? 'success.main' : 'error.main' }}>
                    {item.change30d >= 0 ? <TrendingUp sx={{ fontSize: 18 }} /> : <TrendingDown sx={{ fontSize: 18 }} />}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.change30d.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleWatchlist(item.symbol)}
                      sx={{ color: watchlist.includes(item.symbol) ? '#f59e0b' : 'text.secondary' }}
                    >
                      {watchlist.includes(item.symbol) ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
                    </IconButton>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenChart(item)}
                      startIcon={<BarChart sx={{ fontSize: '1rem !important' }} />}
                      sx={{
                        fontSize: '0.7rem',
                        py: 0.3,
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: 'text.secondary',
                        '&:hover': {
                          borderColor: '#00d4ff',
                          color: '#00d4ff',
                          background: 'rgba(0, 212, 255, 0.05)',
                        },
                      }}
                    >
                      {t('markets.btn_chart')}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* All Markets Table */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{t('markets.all_title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('markets.all_subtitle')}</Typography>
        </Box>
        <Chip 
          label={t('markets.only_favorites')} 
          icon={showWatchlistOnly ? <Star /> : <StarBorder />}
          clickable
          onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
          sx={{
            fontWeight: 600,
            background: showWatchlistOnly ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
            color: showWatchlistOnly ? '#f59e0b' : 'text.secondary',
            border: `1px solid ${showWatchlistOnly ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.1)'}`,
            '&:hover': { background: showWatchlistOnly ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.1)' }
          }}
        />
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Table aria-label="Tüm yatırım ürünleri">
          <TableHead>
            <TableRow>
              <TableCell width={50}></TableCell>
              <TableCell>{t('markets.table_instrument')}</TableCell>
              <TableCell>{t('markets.table_category')}</TableCell>
              <TableCell align="right">{t('markets.table_price')}</TableCell>
              <TableCell align="right">{t('markets.table_change_30d')}</TableCell>
              <TableCell align="center">{t('markets.btn_chart')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {markets.filter(m => !showWatchlistOnly || watchlist.includes(m.symbol)).map((item) => (
              <TableRow key={item.symbol}>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => toggleWatchlist(item.symbol)}
                    sx={{ color: watchlist.includes(item.symbol) ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}
                  >
                    {watchlist.includes(item.symbol) ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
                  </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00d4ff' }}>{item.symbol}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.name}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.category}
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      height: 22,
                      background: `${categoryColors[item.category]}15`,
                      color: categoryColors[item.category],
                      border: `1px solid ${categoryColors[item.category]}30`,
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatMoney(item.price, ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"].includes(item.symbol) ? "USD" : "TRY")}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, color: item.change30d >= 0 ? 'success.main' : 'error.main' }}>
                    {item.change30d >= 0 ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.change30d.toFixed(2)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleOpenChart(item)}
                    sx={{
                      fontSize: '0.7rem',
                      py: 0.3,
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: '#00d4ff',
                        color: '#00d4ff',
                      },
                    }}
                  >
                    {t('markets.table_open_chart')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedChart && (
        <ChartModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selectedChart.name}
          symbol={selectedChart.symbol}
          data={selectedChart.history30d}
          change30d={selectedChart.change30d}
          price={selectedChart.price}
        />
      )}
    </Box>
  );
}
