import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MarketInstrument } from "../types";
import { api } from "../api";
import { useMarket } from "../contexts/MarketContext";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Chip,
  Alert,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Star,
  BarChart,
  SwapHoriz,
  StarBorder,
} from "@mui/icons-material";
import ChartModal from "../components/ChartModal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../contexts/CurrencyContext";

const categoryColors: Record<string, string> = {
  crypto: "#f59e0b",
  forex: "#3b82f6",
  gold: "#ffd700",
  silver: "#c0c0c0",
};

// categoryLabels will be moved inside the component to use translation

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <Box sx={{ width: 100, height: 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color.replace("#", "")})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { instruments, loading: marketLoading } = useMarket();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<MarketInstrument | null>(null);
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();

  const categoryLabels: Record<string, string> = {
    crypto: t('watchlist.cat_crypto'),
    forex: t('watchlist.cat_forex'),
    gold: t('watchlist.cat_gold'),
    silver: t('watchlist.cat_silver'),
  };

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await api.get("/portfolio/watchlist");
        setWatchlist(res.data.watchlist || []);
      } catch (err) {
        console.error(t('watchlist.error_fetch'), err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, []);

  const toggleWatchlist = async (symbol: string) => {
    try {
      const res = await api.post("/portfolio/watchlist", { symbol });
      setWatchlist(res.data.watchlist || []);
    } catch (err) {
      console.error(t('watchlist.error_toggle'), err);
    }
  };

  const watchedInstruments = instruments.filter((m) =>
    watchlist.includes(m.symbol)
  );

  if (loading || marketLoading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          {t('watchlist.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t('watchlist.subtitle')}
        </Typography>
      </Box>

      {watchedInstruments.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            animation: "slideUp 0.5s ease-out",
          }}
        >
          <StarBorder
            sx={{ fontSize: 64, color: "text.secondary", opacity: 0.3, mb: 2 }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 1, color: "text.secondary" }}
          >
            {t('watchlist.empty_title')}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 3 }}
          >
            {t('watchlist.empty_desc')}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/markets")}
            sx={{
              background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #33ddff 0%, #9655f5 100%)",
              },
            }}
          >
            {t('watchlist.btn_go_markets')}
          </Button>
        </Paper>
      ) : (
        <>
          {/* Summary Chips */}
          <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
            <Chip
              label={`${watchedInstruments.length} ${t('watchlist.instruments_count')}`}
              size="small"
              sx={{
                background: "rgba(0, 212, 255, 0.1)",
                color: "#00d4ff",
                border: "1px solid rgba(0, 212, 255, 0.2)",
                fontWeight: 600,
              }}
            />
            {Object.entries(
              watchedInstruments.reduce((acc, inst) => {
                acc[inst.category] = (acc[inst.category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([cat, count]) => (
              <Chip
                key={cat}
                label={`${categoryLabels[cat] || cat}: ${count}`}
                size="small"
                sx={{
                  background: `${categoryColors[cat]}15`,
                  color: categoryColors[cat],
                  border: `1px solid ${categoryColors[cat]}30`,
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>

          {/* Watchlist Table */}
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              animation: "slideUp 0.5s ease-out",
            }}
          >
            <Table aria-label="Favori enstrümanlar">
              <TableHead>
                <TableRow>
                  <TableCell width={50}></TableCell>
                  <TableCell>{t('watchlist.table_instrument')}</TableCell>
                  <TableCell>{t('watchlist.table_category')}</TableCell>
                  <TableCell align="right">{t('watchlist.table_price')}</TableCell>
                  <TableCell align="right">{t('watchlist.table_change_30d')}</TableCell>
                  <TableCell align="center">{t('watchlist.table_trend')}</TableCell>
                  <TableCell align="center">{t('watchlist.table_action')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {watchedInstruments.map((item, index) => (
                  <TableRow
                    key={item.symbol}
                    sx={{
                      animation: "slideUp 0.4s ease-out forwards",
                      animationDelay: `${index * 0.05}s`,
                      opacity: 0,
                    }}
                  >
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleWatchlist(item.symbol)}
                        sx={{ color: "#f59e0b" }}
                      >
                        <Star fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: "#00d4ff" }}
                      >
                        {item.symbol}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {item.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={categoryLabels[item.category] || item.category}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          height: 22,
                          background: `${categoryColors[item.category]}15`,
                          color: categoryColors[item.category],
                          border: `1px solid ${categoryColors[item.category]}30`,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700 }}
                      >
                        {formatMoney(item.price, ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"].includes(item.symbol) ? "USD" : "TRY")}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 0.5,
                          color:
                            item.change30d >= 0
                              ? "success.main"
                              : "error.main",
                        }}
                      >
                        {item.change30d >= 0 ? (
                          <TrendingUp sx={{ fontSize: 16 }} />
                        ) : (
                          <TrendingDown sx={{ fontSize: 16 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                        >
                          {item.change30d.toFixed(2)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <MiniSparkline
                        data={item.history30d || []}
                        color={item.change30d >= 0 ? "#10b981" : "#ef4444"}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedChart(item);
                            setModalOpen(true);
                          }}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "#00d4ff" },
                          }}
                        >
                          <BarChart fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate("/trading")}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "#10b981" },
                          }}
                        >
                          <SwapHoriz fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

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
