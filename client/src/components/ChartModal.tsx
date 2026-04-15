import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  // Transform data for recharts
  const chartData = data.map((value, index) => ({
    day: index + 1,
    price: value,
    originalPrice: value,
  }));

  const isPositive = change30d >= 0;
  const minPrice = Math.min(...data);
  const maxPrice = Math.max(...data);
  const priceRange = maxPrice - minPrice;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box>
          <Typography variant="h6">
            {title} ({symbol})
          </Typography>
          <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Güncel Fiyat
              </Typography>
              <Typography variant="h5">{formatMoney(price)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                30 Gün Değişim
              </Typography>
              <Typography variant="h5" color={isPositive ? "success.main" : "error.main"}>
                {change30d.toFixed(2)}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Min - Max
              </Typography>
              <Typography variant="body2">
                {formatMoney(minPrice)} - {formatMoney(maxPrice)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ height: 400 }}>
        <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: "text.secondary" }}>
            30 Günlük Fiyat Hareketi
          </Typography>
          
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                dataKey="day" 
                stroke="rgba(0,0,0,0.3)"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="rgba(0,0,0,0.3)"
                tick={{ fontSize: 12 }}
                width={60}
                domain={["dataMin", "dataMax"]}
                tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: `2px solid ${isPositive ? "#10b981" : "#ef4444"}`,
                  borderRadius: 8,
                }}
                formatter={(value: number) => [formatMoney(value), "Fiyat"]}
                labelFormatter={(label) => `Gün ${label}`}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#10b981" : "#ef4444"}
                strokeWidth={2}
                fill="url(#colorPrice)"
                dot={false}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
}
