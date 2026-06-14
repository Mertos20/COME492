import { useEffect, useState } from "react";
import { api } from "../api";
import type { PortfolioSummary, MarketInstrument } from "../types";
import { Grid, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, ToggleButtonGroup, ToggleButton, Chip } from "@mui/material";
import { TrendingUp, TrendingDown, AccountBalance, Assessment, LockOpen, Lock } from '@mui/icons-material';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../contexts/CurrencyContext";

interface RealizedPnlData {
  totalRealizedPnl: number;
  totalRealizedCount: number;
  bySymbol: {
    symbol: string;
    pnl: number;
    totalSold: number;
    tradeCount: number;
    trades: { quantity: number; buyPrice: number; sellPrice: number; pnl: number; date: string }[];
  }[];
}

const toNumber = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

type RangeKey = "1D" | "1W" | "1M" | "1Y";

interface PerformancePoint { label: string; value: number; pnl: number; }

const getSeriesLength = (r: RangeKey) => ({ "1D": 24, "1W": 7, "1M": 30, "1Y": 365 }[r]);

const buildLabels = (length: number, range: RangeKey): string[] => {
  const today = new Date();
  if (range === "1D") {
    return Array.from({ length }, (_v, i) => {
      const d = new Date(today);
      d.setHours(today.getHours() - (length - 1 - i));
      return `${d.getHours().toString().padStart(2, '0')}:00`;
    });
  }
  if (range === "1W") {
    return Array.from({ length }, (_v, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (length - 1 - i));
      return d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" });
    });
  }
  if (range === "1M") {
    return Array.from({ length }, (_v, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (length - 1 - i));
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    });
  }
  if (range === "1Y") {
    return Array.from({ length }, (_v, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (length - 1 - i));
      return d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
    });
  }
  return Array.from({ length }, (_v, i) => `${i + 1}`);
};

const get30DayPriceSeries = (market: MarketInstrument | undefined, fallbackPrice: number): number[] => {
  const raw = market?.history30d || [];
  const series = raw.map(v => toNumber(v)).filter(v => Number.isFinite(v) && v > 0);
  if (series.length >= 30) return series.slice(series.length - 30);
  const safe = series.length > 0 ? series : [toNumber(fallbackPrice) || 0];
  const missing = 30 - safe.length;
  return [...Array.from({ length: missing }, () => safe[0]), ...safe];
};

const buildRangeSeriesFrom30d = (s: number[], range: RangeKey): number[] => {
  if (range === "1M") return [...s];
  if (range === "1W") return s.slice(-7);
  if (range === "1D") {
    const y = s[s.length - 2] ?? s[s.length - 1] ?? 0;
    const t = s[s.length - 1] ?? y;
    return Array.from({ length: 24 }, (_v, i) => y + ((t - y) * (i / 23)));
  }
  return [...Array.from({ length: 335 }, () => s[0] ?? 0), ...s];
};

const buildPerformanceSeries = (holdings: PortfolioSummary["holdings"], markets: MarketInstrument[], range: RangeKey, convertPrice: (v: number, base: "TRY" | "USD") => number): PerformancePoint[] => {
  const length = getSeriesLength(range);
  const labels = buildLabels(length, range);
  const marketMap = new Map(markets.map(m => [m.symbol, m]));
  
  const isUsd = (sym: string) => ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"].includes(sym);

  let invested = 0;
  for (const h of holdings) {
    invested += (toNumber(h.quantity) * convertPrice(toNumber(h.avgBuyPrice), isUsd(h.symbol) ? "USD" : "TRY"));
  }

  if (holdings.length === 0) return labels.map(l => ({ label: l, value: 0, pnl: 0 }));
  const vs = Array.from({ length }, () => 0);
  
  // Note: For perfect historical chart we'd use historical USDTRY rates.
  // Here we approximate historical values in the user's selected currency by converting using the current rate,
  // or using the USDTRY historical array if available.
  const usdtryMarket = marketMap.get("USDTRY");
  const usdtryHistory = buildRangeSeriesFrom30d(get30DayPriceSeries(usdtryMarket, usdtryMarket?.price || 37), range);

  for (const h of holdings) {
    const q = toNumber(h.quantity);
    if (q <= 0) continue;
    const isU = isUsd(h.symbol);
    const rs = buildRangeSeriesFrom30d(get30DayPriceSeries(marketMap.get(h.symbol), toNumber(h.currentPrice)), range);
    for (let i = 0; i < length; i++) {
      let valInTry = rs[i];
      if (isU) valInTry = rs[i] * (usdtryHistory[i] || usdtryMarket?.price || 37);
      
      // We convert from TRY to target currency using convertPrice, passing TRY as base
      vs[i] += q * convertPrice(valInTry, "TRY");
    }
  }
  return vs.map((v, i) => ({ label: labels[i], value: v, pnl: v - invested }));
};

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [markets, setMarkets] = useState<MarketInstrument[]>([]);
  const [range, setRange] = useState<RangeKey>("1M");
  const [loading, setLoading] = useState(true);
  const [realizedPnl, setRealizedPnl] = useState<RealizedPnlData | null>(null);
  const { t } = useTranslation();
  const { formatMoney, convertPrice } = useCurrency();

  useEffect(() => {
    const load = async () => {
      try {
        const [p, m, r] = await Promise.all([
          api.get<PortfolioSummary>("/portfolio/summary"),
          api.get<MarketInstrument[]>("/markets/all"),
          api.get<RealizedPnlData>("/portfolio/realized-pnl"),
        ]);
        setPortfolio(p.data); setMarkets(m.data); setRealizedPnl(r.data);
      } catch { console.error(t('portfolio.error_console')); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <LoadingSkeleton type="dashboard" />;
  if (!portfolio) return <Alert severity="error">{t('portfolio.error_loading')}</Alert>;

  const totalPnl = toNumber(portfolio.totalPnl);
  const totalPnlPercent = toNumber(portfolio.totalPnlPercent);
  const investmentValue = toNumber(portfolio.investmentValue);
  const currentValue = toNumber(portfolio.currentValue);
  const balance = toNumber(portfolio.balance);
  const performanceSeries = buildPerformanceSeries(portfolio.holdings, markets, range, convertPrice);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{t('portfolio.title')}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>{t('portfolio.subtitle')}</Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', background: totalPnl >= 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)' : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)', border: `1px solid ${totalPnl >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, animation: 'slideUp 0.5s ease-out' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Assessment sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('portfolio.general_status')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', color: totalPnl >= 0 ? 'success.main' : 'error.main', gap: 0.5 }}>
              {totalPnl >= 0 ? <TrendingUp sx={{ fontSize: 28 }} /> : <TrendingDown sx={{ fontSize: 28 }} />}
              <Typography variant="h4" component="span" sx={{ fontWeight: 800 }}>{formatMoney(totalPnl)}</Typography>
              <Typography variant="h6" sx={{ opacity: 0.8, ml: 0.5 }}>({totalPnlPercent.toFixed(2)}%)</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', animation: 'slideUp 0.5s ease-out' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <AccountBalance sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('portfolio.values')}</Typography>
            </Box>
            {[{ l: t('portfolio.investment_value'), v: formatMoney(investmentValue), c: '#7c3aed' }, { l: t('portfolio.current_value'), v: formatMoney(currentValue), c: '#00d4ff' }, { l: t('portfolio.balance'), v: formatMoney(balance), c: '#10b981' }].map(i => (
              <Box key={i.l} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{i.l}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: i.c }}>{i.v}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {portfolio.holdings.length === 0 ? <Alert severity="info">{t('portfolio.no_assets')}</Alert> : (
        <TableContainer component={Paper} elevation={0} sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', mb: 4 }}>
          <Table>
            <TableHead><TableRow>
              <TableCell>{t('portfolio.table_symbol')}</TableCell><TableCell align="right">{t('portfolio.table_amount')}</TableCell><TableCell align="right">{t('portfolio.table_avg_buy')}</TableCell>
              <TableCell align="right">{t('portfolio.table_current_price')}</TableCell><TableCell align="right">{t('portfolio.table_total_value')}</TableCell>
              <TableCell align="right">{t('portfolio.table_pnl')}</TableCell><TableCell align="right">{t('portfolio.table_pnl_percent')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {portfolio.holdings.map(row => {
                const isUsd = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"].includes(row.symbol);
                const base = isUsd ? "USD" : "TRY";
            const usdtry = markets.find(m => m.symbol === "USDTRY")?.price || 37;
            const tvInTry = row.quantity * row.currentPrice * (isUsd ? usdtry : 1);
                const pp = row.avgBuyPrice > 0 ? ((row.currentPrice - row.avgBuyPrice) / row.avgBuyPrice) * 100 : 0;
                return (<TableRow key={row.symbol}>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 700, color: '#00d4ff' }}>{row.symbol}</Typography></TableCell>
                  <TableCell align="right">{row.quantity}</TableCell>
                  <TableCell align="right">{formatMoney(row.avgBuyPrice, base)}</TableCell>
                  <TableCell align="right">{formatMoney(row.currentPrice, base)}</TableCell>
              <TableCell align="right">{formatMoney(tvInTry)}</TableCell>
              <TableCell align="right"><Typography variant="body2" sx={{ color: row.pnl >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>{formatMoney(row.pnl)}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" sx={{ color: pp >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>{pp.toFixed(2)}%</Typography></TableCell>
                </TableRow>);
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Paper elevation={0} sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{t('portfolio.chart_title')}</Typography>
        <Box sx={{ width: "100%", height: { xs: 320, md: 450 }, minHeight: { xs: 320, md: 450 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceSeries} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} /><stop offset="95%" stopColor="#00d4ff" stopOpacity={0} /></linearGradient>
                <linearGradient id="pp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} stroke="rgba(255,255,255,0.06)" />
              <YAxis tickFormatter={v => `${Math.round(toNumber(v))}`} width={70} tick={{ fontSize: 12, fill: '#64748b' }} stroke="rgba(255,255,255,0.06)" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17,22,56,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 12, color: '#e2e8f0' }}
                formatter={(value: number, name: string) => name === "pnl" ? [formatMoney(toNumber(value)), t('portfolio.tooltip_pnl')] : [formatMoney(toNumber(value)), t('portfolio.tooltip_value')]}
                labelFormatter={l => `${t('portfolio.tooltip_period')}: ${l}`} />
              <Area type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} fill="url(#pv)" name="value" />
              <Area type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={2} fill="url(#pp)" name="pnl" />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <ToggleButtonGroup value={range} exclusive onChange={(_e, n) => { if (n) setRange(n); }} size="small">
            <ToggleButton value="1D">{t('portfolio.1d')}</ToggleButton>
            <ToggleButton value="1W">{t('portfolio.1w')}</ToggleButton>
            <ToggleButton value="1M">{t('portfolio.1m')}</ToggleButton>
            <ToggleButton value="1Y">{t('portfolio.1y')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Realized vs Unrealized PnL Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{t('portfolio.realized_vs_unrealized')}</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Unrealized PnL Card */}
          <Grid xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                background: totalPnl >= 0
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 100%)',
                border: `1px solid ${totalPnl >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('portfolio.unrealized_pnl')}</Typography>
                <Chip label={t('portfolio.open_positions')} size="small" sx={{ ml: 'auto', height: 20, fontSize: '0.6rem', fontWeight: 600, background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, color: totalPnl >= 0 ? 'success.main' : 'error.main' }}>
                {totalPnl >= 0 ? <TrendingUp sx={{ fontSize: 28 }} /> : <TrendingDown sx={{ fontSize: 28 }} />}
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{formatMoney(totalPnl)}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>({totalPnlPercent.toFixed(2)}%)</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                {t('portfolio.unrealized_desc')}
              </Typography>
            </Paper>
          </Grid>

          {/* Realized PnL Card */}
          <Grid xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                background: (realizedPnl?.totalRealizedPnl ?? 0) >= 0
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 100%)',
                border: `1px solid ${(realizedPnl?.totalRealizedPnl ?? 0) >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <LockOpen sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('portfolio.realized_pnl')}</Typography>
                <Chip label={t('portfolio.sold_positions')} size="small" sx={{ ml: 'auto', height: 20, fontSize: '0.6rem', fontWeight: 600, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, color: (realizedPnl?.totalRealizedPnl ?? 0) >= 0 ? 'success.main' : 'error.main' }}>
                {(realizedPnl?.totalRealizedPnl ?? 0) >= 0 ? <TrendingUp sx={{ fontSize: 28 }} /> : <TrendingDown sx={{ fontSize: 28 }} />}
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{formatMoney(realizedPnl?.totalRealizedPnl ?? 0)}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                {t('portfolio.realized_desc', { count: realizedPnl?.totalRealizedCount ?? 0 })}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Realized trades per symbol */}
        {realizedPnl && realizedPnl.bySymbol.length > 0 && (
          <TableContainer component={Paper} elevation={0} sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('portfolio.table_symbol')}</TableCell>
                  <TableCell align="right">{t('portfolio.table_trade_count')}</TableCell>
                  <TableCell align="right">{t('portfolio.table_total_sales')}</TableCell>
                  <TableCell align="right">{t('portfolio.realized_pnl')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {realizedPnl.bySymbol.map(item => (
                  <TableRow key={item.symbol}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#00d4ff' }}>{item.symbol}</Typography>
                    </TableCell>
                    <TableCell align="right">{item.tradeCount}</TableCell>
                  <TableCell align="right">{formatMoney(item.totalSold)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: item.pnl >= 0 ? 'success.main' : 'error.main' }}>
                      {item.pnl >= 0 ? '+' : ''}{formatMoney(item.pnl)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
