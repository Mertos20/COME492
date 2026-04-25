import { useEffect, useState } from "react";
import { api } from "../api";
import type { PortfolioSummary, MarketInstrument } from "../types";
import { Grid, Paper, Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

const toNumber = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

type RangeKey = "1D" | "1W" | "1M" | "1Y";

interface PerformancePoint {
  label: string;
  value: number;
  pnl: number;
}

const getSeriesLength = (range: RangeKey): number => {
  if (range === "1D") return 24;
  if (range === "1W") return 7;
  if (range === "1M") return 30;
  return 365;
};

const buildLabels = (length: number, range: RangeKey): string[] => {
  if (range === "1D") {
    return Array.from({ length }, (_v, i) => `${i}:00`);
  }

  if (range === "1W") {
    return ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"];
  }

  if (range === "1M") {
    return Array.from({ length }, (_v, i) => `${i + 1}`);
  }

  return Array.from({ length }, (_v, i) => `${i + 1}`);
};

const get30DayPriceSeries = (market: MarketInstrument | undefined, fallbackPrice: number): number[] => {
  const raw = market?.history30d || [];
  const series = raw
    .map((value) => toNumber(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (series.length >= 30) {
    return series.slice(series.length - 30);
  }

  const safe = series.length > 0 ? series : [toNumber(fallbackPrice) || 0];
  const fillValue = safe[0];
  const missing = 30 - safe.length;
  return [...Array.from({ length: missing }, () => fillValue), ...safe];
};

const buildRangeSeriesFrom30d = (series30d: number[], range: RangeKey): number[] => {
  if (range === "1M") {
    return [...series30d];
  }

  if (range === "1W") {
    return series30d.slice(-7);
  }

  if (range === "1D") {
    const yesterday = series30d[series30d.length - 2] ?? series30d[series30d.length - 1] ?? 0;
    const today = series30d[series30d.length - 1] ?? yesterday;
    return Array.from({ length: 24 }, (_v, i) => yesterday + ((today - yesterday) * (i / 23)));
  }

  const olderDays = 365 - 30;
  const headValue = series30d[0] ?? 0;
  return [...Array.from({ length: olderDays }, () => headValue), ...series30d];
};

const buildPerformanceSeries = (
  holdings: PortfolioSummary["holdings"],
  markets: MarketInstrument[],
  range: RangeKey
): PerformancePoint[] => {
  const length = getSeriesLength(range);
  const labels = buildLabels(length, range);
  const marketMap = new Map(markets.map((market) => [market.symbol, market]));
  const invested = holdings.reduce((sum, item) => sum + (toNumber(item.quantity) * toNumber(item.avgBuyPrice)), 0);

  if (holdings.length === 0) {
    return labels.map((label) => ({ label, value: 0, pnl: 0 }));
  }

  const valueSeries = Array.from({ length }, () => 0);

  for (const holding of holdings) {
    const quantity = toNumber(holding.quantity);
    if (quantity <= 0) {
      continue;
    }

    const market = marketMap.get(holding.symbol);
    const fallbackPrice = toNumber(holding.currentPrice);
    const series30d = get30DayPriceSeries(market, fallbackPrice);
    const rangeSeries = buildRangeSeriesFrom30d(series30d, range);

    for (let i = 0; i < length; i += 1) {
      valueSeries[i] += quantity * toNumber(rangeSeries[i]);
    }
  }

  return valueSeries.map((value, index) => ({
    label: labels[index],
    value,
    pnl: value - invested
  }));
};

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [markets, setMarkets] = useState<MarketInstrument[]>([]);
  const [range, setRange] = useState<RangeKey>("1M");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const [portfolioRes, marketsRes] = await Promise.all([
          api.get<PortfolioSummary>("/portfolio/summary"),
          api.get<MarketInstrument[]>("/markets/all")
        ]);
        setPortfolio(portfolioRes.data);
        setMarkets(marketsRes.data);
      } catch {
        console.error("Portföy yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!portfolio) {
    return <Alert severity="error">Portföy bilgileri yüklenemedi.</Alert>;
  }

  const totalPnl = toNumber(portfolio.totalPnl);
  const totalPnlPercent = toNumber(portfolio.totalPnlPercent);
  const investmentValue = toNumber(portfolio.investmentValue);
  const currentValue = toNumber(portfolio.currentValue);
  const balance = toNumber(portfolio.balance);
  const performanceSeries = buildPerformanceSeries(portfolio.holdings, markets, range);

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Portföy Detayları</Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6">Genel Durum</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', color: totalPnl >= 0 ? 'success.main' : 'error.main' }}>
                  {totalPnl >= 0 ? <ArrowUpward /> : <ArrowDownward />}
                    <Typography variant="h5" component="span" sx={{ fontWeight: 'bold', mx: 1 }}>
                    {formatMoney(totalPnl)}
                    </Typography>
                    <Typography variant="subtitle1">
                    ({totalPnlPercent.toFixed(2)}%)
                    </Typography>
                </Box>
            </Paper>
        </Grid>
        <Grid xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography><strong>Yatırım Değeri:</strong> {formatMoney(investmentValue)}</Typography>
                <Typography><strong>Anlık Değer:</strong> {formatMoney(currentValue)}</Typography>
                <Typography><strong>Bakiye:</strong> {formatMoney(balance)}</Typography>
            </Paper>
        </Grid>
      </Grid>

      {portfolio.holdings.length === 0 ? (
        <Alert severity="info">Henüz bir varlık edinmemişsiniz.</Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sembol</TableCell>
                <TableCell align="right">Miktar</TableCell>
                <TableCell align="right">Ort. Alış Fiyatı</TableCell>
                <TableCell align="right">Anlık Fiyat</TableCell>
                <TableCell align="right">Toplam Değer</TableCell>
                <TableCell align="right">Kar/Zarar</TableCell>
                <TableCell align="right">Kar/Zarar %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {portfolio.holdings.map((row) => {
                const totalValue = row.quantity * row.currentPrice;
                const pnlPercent = row.avgBuyPrice > 0 ? ((row.currentPrice - row.avgBuyPrice) / row.avgBuyPrice) * 100 : 0;
                return (
                  <TableRow key={row.symbol}>
                    <TableCell component="th" scope="row">{row.symbol}</TableCell>
                    <TableCell align="right">{row.quantity}</TableCell>
                    <TableCell align="right">{formatMoney(row.avgBuyPrice)}</TableCell>
                    <TableCell align="right">{formatMoney(row.currentPrice)}</TableCell>
                    <TableCell align="right">{formatMoney(totalValue)}</TableCell>
                    <TableCell align="right" sx={{ color: row.pnl >= 0 ? 'success.main' : 'error.main' }}>
                      {formatMoney(row.pnl)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: pnlPercent >= 0 ? 'success.main' : 'error.main' }}>
                      {pnlPercent.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Paper variant="outlined" sx={{ mt: 4, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Kazanç / Zarar Grafiği
        </Typography>
        <Box sx={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={performanceSeries} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${Math.round(toNumber(value))}`} width={70} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "pnl") return [formatMoney(toNumber(value)), "Kar/Zarar"];
                  return [formatMoney(toNumber(value)), "Portföy Değeri"];
                }}
                labelFormatter={(label) => `Periyot: ${label}`}
              />
              <Area type="monotone" dataKey="value" stroke="#1976d2" fill="#90caf9" fillOpacity={0.35} name="value" />
              <Area type="monotone" dataKey="pnl" stroke="#2e7d32" fill="#a5d6a7" fillOpacity={0.25} name="pnl" />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <ToggleButtonGroup
            value={range}
            exclusive
            onChange={(_event, next) => {
              if (next) setRange(next);
            }}
            size="small"
          >
            <ToggleButton value="1D">1 Day</ToggleButton>
            <ToggleButton value="1W">1 Week</ToggleButton>
            <ToggleButton value="1M">1 Month</ToggleButton>
            <ToggleButton value="1Y">1 Year</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>
    </Paper>
  );
}
