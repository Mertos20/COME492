import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Chip } from "@mui/material";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "@mui/icons-material";

interface ChartModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  symbol: string;
  data: number[];
  change30d: number;
  price: number;
}

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(value);

export default function ChartModal({ open, onClose, title, symbol, data, change30d, price }: ChartModalProps) {
  const chartData = data.map((value, index) => ({ day: index + 1, price: value }));
  const isPositive = change30d >= 0;
  const minPrice = Math.min(...data);
  const maxPrice = Math.max(...data);
  const strokeColor = isPositive ? "#10b981" : "#ef4444";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#00d4ff' }}>{title}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{symbol}</Typography>
          </Box>
          <Chip
            icon={isPositive ? <TrendingUp sx={{ fontSize: '1rem !important', color: `${strokeColor} !important` }} /> : <TrendingDown sx={{ fontSize: '1rem !important', color: `${strokeColor} !important` }} />}
            label={`${change30d.toFixed(2)}%`}
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
            { label: 'Güncel Fiyat', value: formatMoney(price), color: '#e2e8f0' },
            { label: '30G Değişim', value: `${change30d.toFixed(2)}%`, color: strokeColor },
            { label: 'Min — Max', value: `${formatMoney(minPrice)} — ${formatMoney(maxPrice)}`, color: '#94a3b8' },
          ].map(s => (
            <Box key={s.label}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>{s.label}</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
            </Box>
          ))}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ height: 380 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>30 Günlük Fiyat Hareketi</Typography>
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
            <YAxis stroke="rgba(255,255,255,0.06)" tick={{ fontSize: 12, fill: '#64748b' }} width={60} domain={["dataMin", "dataMax"]}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(17,22,56,0.95)', border: `1px solid ${strokeColor}40`, borderRadius: 12, color: '#e2e8f0' }}
              formatter={(value: number) => [formatMoney(value), "Fiyat"]}
              labelFormatter={(label) => `Gün ${label}`} />
            <Area type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2} fill="url(#chartGradient)" dot={false} activeDot={{ r: 5, fill: strokeColor, stroke: '#111638', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary' }}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
}
