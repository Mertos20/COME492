import { useEffect, useState } from "react";
import type { MarketInstrument } from "../types";
import { api } from "../api";
import { io } from "socket.io-client";
import { Grid, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Switch } from "@mui/material";
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import ChartModal from "../components/ChartModal";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(value);

interface MarketsPageProps {
  markets: MarketInstrument[];
  popular: MarketInstrument[];
}

export default function MarketsPage({ markets: initialMarkets, popular: initialPopular }: MarketsPageProps) {
  const [popular, setPopular] = useState(initialPopular);
  const [markets, setMarkets] = useState(initialMarkets);
  const [showChart, setShowChart] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<MarketInstrument | null>(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const instance = io(`${socketUrl}/market`);

    instance.on("market:update", (data: MarketInstrument[]) => {
      setMarkets(data);
      setPopular(data.filter((item) => item.popular));
    });

    return () => {
      instance.disconnect();
    };
  }, []);

  const handleChartToggle = (symbol: string) => {
    setShowChart(prev => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  const handleOpenChart = (item: MarketInstrument) => {
    setSelectedChart(item);
    setModalOpen(true);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Popüler Yatırım Ürünleri</Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {popular.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.symbol}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" component="div">{item.name}</Typography>
                <Typography color="text.secondary">{item.symbol}</Typography>
                <Typography variant="h5" sx={{ my: 1 }}>{formatMoney(item.price)}</Typography>
                <Typography color={item.change30d >= 0 ? "success.main" : "error.main"}>
                  {item.change30d.toFixed(2)}% (30g)
                </Typography>
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary"
                  onClick={() => handleOpenChart(item)}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Grafiği Göster
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h4" gutterBottom>Yatırım Ürünleri - Hepsi</Typography>
      <TableContainer component={Paper}>
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
                  <Typography variant="subtitle2">{item.symbol}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.name}</Typography>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell align="right">{formatMoney(item.price)}</TableCell>
                <TableCell align="right" sx={{ color: item.change30d >= 0 ? 'success.main' : 'error.main' }}>
                  {item.change30d.toFixed(2)}%
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => handleOpenChart(item)}
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
