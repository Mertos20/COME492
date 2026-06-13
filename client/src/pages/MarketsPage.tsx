import { useEffect, useState } from "react";
import type { MarketInstrument } from "../types";
import { api } from "../api";
import { io } from "socket.io-client";
import { Grid, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Chip } from "@mui/material";
import { TrendingUp, TrendingDown, BarChart } from "@mui/icons-material";
import ChartModal from "../components/ChartModal";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(value);

import { useMarket } from "../contexts/MarketContext";

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

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Yükleniyor...</Typography></Box>;
  }

  const handleOpenChart = (item: MarketInstrument) => {
    setSelectedChart(item);
    setModalOpen(true);
  };

  return (
    <Box>
      {/* Section Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Popüler Yatırım Ürünleri</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>En çok işlem gören yatırım araçları</Typography>
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
                  {formatMoney(item.price)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: item.change30d >= 0 ? 'success.main' : 'error.main' }}>
                    {item.change30d >= 0 ? <TrendingUp sx={{ fontSize: 18 }} /> : <TrendingDown sx={{ fontSize: 18 }} />}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.change30d.toFixed(2)}%
                    </Typography>
                  </Box>
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
                    Grafik
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* All Markets Table */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Tüm Yatırım Ürünleri</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Piyasa fiyatları gerçek zamanlı güncellenmektedir</Typography>
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
              <TableCell>Ürün</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell align="right">Fiyat</TableCell>
              <TableCell align="right">30G Değişim</TableCell>
              <TableCell align="center">Grafik</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {markets.map((item) => (
              <TableRow key={item.symbol}>
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
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatMoney(item.price)}</Typography>
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
                    Grafiği Aç
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
