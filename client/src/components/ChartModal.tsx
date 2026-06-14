import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Chip, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../contexts/CurrencyContext";

interface ChartModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  symbol: string;
  data: number[];
  change30d: number;
  price: number;
}

type RangeKey = "1D" | "1W" | "1M";

export default function ChartModal({ open, onClose, title, symbol, data, change30d, price }: ChartModalProps) {
  const [range, setRange] = useState<RangeKey>("1M");
  const today = new Date();
  const { t } = useTranslation();
  const { formatMoney, convertPrice } = useCurrency();
  const base = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"].includes(symbol) ? "USD" : "TRY";

  let rangeData = data;
  if (range === "1M") rangeData = data;
  else if (range === "1W") rangeData = data.slice(-7);
  else if (range === "1D") {
    const y = data[data.length - 2] ?? data[data.length - 1] ?? 0;
    const t = data[data.length - 1] ?? y;
    rangeData = Array.from({ length: 24 }, (_v, i) => y + ((t - y) * (i / 23)));
  }

  const chartData = rangeData.map((value, index) => {
    const d = new Date(today);
    if (range === "1D") {
      d.setHours(today.getHours() - (rangeData.length - 1 - index));
      return { day: `${d.getHours().toString().padStart(2, '0')}:00`, price: value };
    } else if (range === "1W") {
      d.setDate(today.getDate() - (rangeData.length - 1 - index));
      return { day: d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" }), price: value };
    } else {
      d.setDate(today.getDate() - (rangeData.length - 1 - index));
      return { day: d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }), price: value };
    }
  });

  const startPrice = rangeData[0] || 1; // prevent div by zero
  const endPrice = rangeData[rangeData.length - 1] || 1;
  const rangeChangePercent = range === "1M" ? change30d : ((endPrice - startPrice) / startPrice) * 100;

  const isPositive = rangeChangePercent >= 0;
  const minPrice = Math.min(...rangeData);
  const maxPrice = Math.max(...rangeData);
  const strokeColor = isPositive ? "#10b981" : "#ef4444";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#00d4ff' }}>{title}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{symbol}</Typography>
          </Box>
          <Chip
            icon={isPositive ? <TrendingUp sx={{ fontSize: '1rem !important', color: `${strokeColor} !important` }} /> : <TrendingDown sx={{ fontSize: '1rem !important', color: `${strokeColor} !important` }} />}
            label={`${rangeChangePercent >= 0 ? '+' : ''}${rangeChangePercent.toFixed(2)}%`}
            size="small"
            sx={{
              fontWeight: 700,
              background: isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: strokeColor,
              border: `1px solid ${isPositive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
          {[
            { label: t('chart.current_price'), value: formatMoney(price, base), color: '#e2e8f0' },
            { label: range === '1D' ? t('chart.change_24h') : range === '1W' ? t('chart.change_7d') : t('chart.change_30d'), value: `${rangeChangePercent >= 0 ? '+' : ''}${rangeChangePercent.toFixed(2)}%`, color: strokeColor },
            { label: t('chart.min_max'), value: `${formatMoney(minPrice, base)} — ${formatMoney(maxPrice, base)}`, color: '#94a3b8' },
          ].map(s => (
            <Box key={s.label}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>{s.label}</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
            </Box>
          ))}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ height: 450 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
            {range === "1D" ? t('chart.period_24h') : range === "1W" ? t('chart.period_7d') : t('chart.period_30d')} {t('chart.price_movement')}
          </Typography>
          <ToggleButtonGroup value={range} exclusive onChange={(_e, n) => { if (n) setRange(n); }} size="small">
            <ToggleButton value="1D" sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}>{t('chart.range_1d')}</ToggleButton>
            <ToggleButton value="1W" sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}>{t('chart.range_1w')}</ToggleButton>
            <ToggleButton value="1M" sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}>{t('chart.range_1m')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" stroke="rgba(255,255,255,0.06)" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis stroke="rgba(255,255,255,0.06)" tick={{ fontSize: 12, fill: '#64748b' }} width={80} domain={["dataMin", "dataMax"]}
              tickFormatter={(value) => formatMoney(value, base)} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(17,22,56,0.95)', border: `1px solid ${strokeColor}40`, borderRadius: 12, color: '#e2e8f0' }}
              formatter={(value: number) => [formatMoney(value, base), t('chart.tooltip_price')]}
              labelFormatter={(label) => label} />
            <Area type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2} fill="url(#chartGradient)" dot={false} activeDot={{ r: 5, fill: strokeColor, stroke: '#111638', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary' }}>{t('chart.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
