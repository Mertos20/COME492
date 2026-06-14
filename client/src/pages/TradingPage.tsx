import { useState, useEffect } from "react";
import { api } from "../api";
import { useMarket } from "../contexts/MarketContext";
import { 
  Grid, Paper, Typography, TextField, Button, CircularProgress, 
  Select, MenuItem, FormControl, InputLabel, Alert, ToggleButtonGroup, 
  ToggleButton, Box, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton
} from "@mui/material";
import { 
  AccountBalanceWallet, SwapHoriz, TrendingUp, TrendingDown, Cancel, NotificationsActive, Fullscreen, FullscreenExit
} from "@mui/icons-material";
import LoadingSkeleton from "../components/LoadingSkeleton";
import CheckoutModal from "../components/CheckoutModal";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../contexts/CurrencyContext";

interface TradingPageProps {
  balance: number;
  onTradeComplete: () => void;
}

interface PendingOrder {
  _id: string;
  symbol: string;
  type: "market" | "limit" | "stop";
  side: "buy" | "sell";
  quantity: number;
  targetPrice: number;
  status: string;
  createdAt: string;
}

export default function TradingPage({ balance, onTradeComplete }: TradingPageProps) {
  const { instruments: markets, loading: pageLoading } = useMarket();
  const [depositAmount, setDepositAmount] = useState("10000");
  const [order, setOrder] = useState({ 
    side: "buy", 
    symbol: "", 
    quantity: "0.05",
    type: "market",
    targetPrice: ""
  });
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [holdings, setHoldings] = useState<{ symbol: string; quantity: number }[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // Alert state
  const [alertTarget, setAlertTarget] = useState("");
  const [alertCondition, setAlertCondition] = useState<"above" | "below">("above");
  const [alertLoading, setAlertLoading] = useState(false);
  const { t } = useTranslation();
  const { formatMoney, convertPrice } = useCurrency();

  useEffect(() => {
    const availableMarkets = order.side === "sell" ? markets.filter(m => holdings.some(h => h.symbol === m.symbol)) : markets;
    if (availableMarkets.length > 0 && (!order.symbol || !availableMarkets.some(m => m.symbol === order.symbol))) {
      setOrder((prev) => ({ ...prev, symbol: availableMarkets[0].symbol }));
    } else if (availableMarkets.length === 0 && order.symbol) {
      setOrder((prev) => ({ ...prev, symbol: "" }));
    }
  }, [markets, order.symbol, order.side, holdings]);

  const loadOrders = async () => {
    try {
      const res = await api.get<PendingOrder[]>("/trade/orders");
      setPendingOrders(res.data);
    } catch (err) {
      console.error(t('trading.error_orders'), err);
    }
  };

  const loadHoldings = async () => {
    try {
      const res = await api.get("/portfolio/summary");
      setHoldings(res.data.holdings || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrders();
    loadHoldings();
    // Refresh pending orders periodically
    const interval = setInterval(() => {
      loadOrders();
      loadHoldings();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      setError(t('trading.error_amount'));
      return;
    }
    setCheckoutOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setCheckoutOpen(false);
    setError("");
    setSuccess(t('trading.success_deposit', { amount: formatMoney(Number(depositAmount), "TRY") }));
    setDepositAmount("10000");
    onTradeComplete(); // Refresh balance from server
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleSetAlert = async () => {
    if (!alertTarget || Number(alertTarget) <= 0) {
      setError(t('trading.error_alert_price'));
      return;
    }
    setAlertLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/alerts", {
        symbol: order.symbol,
        targetPrice: Number(alertTarget),
        condition: alertCondition
      });
      setSuccess(t('trading.success_alert', { symbol: order.symbol }));
      setAlertTarget("");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('trading.error_alert'));
    } finally {
      setAlertLoading(false);
    }
  };

  const handleTrade = async (overrideSide?: "buy" | "sell" | any) => {
    const activeSide = (overrideSide === "buy" || overrideSide === "sell") ? overrideSide : order.side;
    const quantity = Number(order.quantity);
    if (!quantity || quantity <= 0) {
      setError(t('trading.error_quantity'));
      return;
    }

    if (activeSide === "sell") {
      const ownedQuantity = holdings.find(h => h.symbol === order.symbol)?.quantity || 0;
      if (quantity > ownedQuantity) {
        setError(t('trading.error_quantity')); // Or a specific error
        return;
      }
    }

    const targetPrice = Number(order.targetPrice);
    if (order.type !== "market" && (!targetPrice || targetPrice <= 0)) {
      setError(t('trading.error_target_price'));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/trade/order", {
        side: activeSide,
        symbol: order.symbol,
        quantity,
        type: order.type,
        targetPrice: order.type === "market" ? undefined : targetPrice
      });
      setSuccess(res.data.message || t('trading.success_trade'));
      onTradeComplete();
      loadOrders(); // Refresh orders if it was a limit/stop order
      loadHoldings(); // Refresh holdings
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('trading.error_trade'));
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      await api.delete(`/trade/orders/${id}`);
      setSuccess(t('trading.success_cancel'));
      onTradeComplete(); // Refund updates balance
      loadOrders();
      loadHoldings();
    } catch (err: any) {
      setError(err.response?.data?.message || t('trading.error_cancel'));
    }
  };

  if (pageLoading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  const selectedMarket = markets.find(m => m.symbol === order.symbol);
  const isUsd = selectedMarket && ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"].includes(selectedMarket.symbol);
  const base = isUsd ? "USD" : "TRY";
  const currentPrice = selectedMarket ? selectedMarket.price : 0;
  const isBuy = order.side === "buy";
  
  // Target price is in TRY in the input if it's a USD-based pair. Wait, no. The user enters the price in TRY if they have selected TRY.
  // Actually, targetPrice in the input should probably be in the selected currency, but then sent to backend in TRY.
  // This is tricky. For now, let's just convert the estimatedTotal and currentPrice to the selected currency.
  const estimatedTotalBase = order.type === "market" 
    ? currentPrice * Number(order.quantity) 
    : Number(order.targetPrice) * Number(order.quantity);

    
  const chartData = selectedMarket?.history30d?.map((v, i) => ({ day: i, price: v })) || [];
  const isPositiveChart = selectedMarket ? selectedMarket.change30d >= 0 : true;
  const chartColor = isPositiveChart ? '#10b981' : '#ef4444';

  return (
    <Grid container spacing={3}>
      <Grid xs={12} md={8}>
        <Paper sx={{ p: 4, borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHoriz color="primary" /> {t('trading.quick_trade')}
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setOrder(prev => ({ ...prev, type: 'market' }));
                setZenMode(true);
              }}
              startIcon={<Fullscreen />}
              sx={{ ml: 'auto', borderColor: 'rgba(255,255,255,0.1)', color: '#00d4ff', '&:hover': { borderColor: '#00d4ff', background: 'rgba(0,212,255,0.1)' } }}
            >
              {t('trading.zen_mode')}
            </Button>
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <ToggleButtonGroup
              value={order.side}
              exclusive
              onChange={(e, value) => value && setOrder({ ...order, side: value })}
              sx={{ width: '100%', maxWidth: 400 }}
            >
              <ToggleButton 
                value="buy" 
                sx={{ 
                  flex: 1, 
                  color: isBuy ? '#fff !important' : 'text.secondary',
                  background: isBuy ? 'rgba(16, 185, 129, 0.2) !important' : 'transparent',
                  borderColor: isBuy ? '#10b981 !important' : 'rgba(255, 255, 255, 0.1)',
                  fontWeight: isBuy ? 700 : 500,
                  '&:hover': { background: 'rgba(16, 185, 129, 0.1)' }
                }}
              >
                {t('trading.buy')}
              </ToggleButton>
              <ToggleButton 
                value="sell" 
                sx={{ 
                  flex: 1,
                  color: !isBuy ? '#fff !important' : 'text.secondary',
                  background: !isBuy ? 'rgba(239, 68, 68, 0.2) !important' : 'transparent',
                  borderColor: !isBuy ? '#ef4444 !important' : 'rgba(255, 255, 255, 0.1)',
                  fontWeight: !isBuy ? 700 : 500,
                  '&:hover': { background: 'rgba(239, 68, 68, 0.1)' }
                }}
              >
                {t('trading.sell')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Grid container spacing={3}>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>{t('trading.instrument')}</InputLabel>
                <Select
                  value={order.symbol}
                  onChange={(e) => setOrder({ ...order, symbol: e.target.value })}
                  label={t('trading.instrument')}
                >
                  {(order.side === "sell" ? markets.filter(m => holdings.some(h => h.symbol === m.symbol)) : markets).map((m) => (
                    <MenuItem key={m.symbol} value={m.symbol}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{m.symbol} - {m.name}</span>
                        <span style={{ opacity: 0.7 }}>{formatMoney(m.price, ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"].includes(m.symbol) ? "USD" : "TRY")}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>{t('trading.order_type')}</InputLabel>
                <Select
                  value={order.type}
                  onChange={(e) => setOrder({ ...order, type: e.target.value as any })}
                  label={t('trading.order_type')}
                >
                  <MenuItem value="market">{t('trading.type_market')}</MenuItem>
                  <MenuItem value="limit">{t('trading.type_limit')}</MenuItem>
                  <MenuItem value="stop">{t('trading.type_stop')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12} sm={order.type !== "market" ? 6 : 12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  fullWidth
                  label={t('trading.quantity')}
                  type="number"
                  value={order.quantity}
                  onChange={(e) => setOrder({ ...order, quantity: e.target.value })}
                  slotProps={{
                    htmlInput: { min: 0, step: "any" }
                  }}
                />
                {!isBuy && order.symbol && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {t('trading.available')} <Typography component="span" sx={{ fontWeight: 700, color: '#00d4ff' }}>{Number(holdings.find(h => h.symbol === order.symbol)?.quantity || 0).toFixed(3)} {order.symbol}</Typography>
                    </Typography>
                    <Button 
                      size="small" 
                      onClick={() => setOrder({ ...order, quantity: Number(holdings.find(h => h.symbol === order.symbol)?.quantity || 0).toFixed(3) })}
                      sx={{ fontSize: '0.65rem', minWidth: 'auto', p: '2px 8px' }}
                    >
                      MAX
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>

            {order.type !== "market" && (
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('trading.target_price')}
                  type="number"
                  value={order.targetPrice}
                  onChange={(e) => setOrder({ ...order, targetPrice: e.target.value })}
                  slotProps={{
                    htmlInput: { min: 0, step: "any" }
                  }}
                />
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 4, p: 3, borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
            <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Grid>
                <Typography variant="body2" color="text.secondary">{t('trading.current_price')}</Typography>
                <Typography variant="h6">{formatMoney(currentPrice, base)}</Typography>
              </Grid>
              <Grid sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  {order.type === "market" ? t('trading.est_total') : t('trading.reserved_amount')}
                </Typography>
                <Typography variant="h5" sx={{ color: isBuy ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                  {estimatedTotalBase > 0 ? formatMoney(estimatedTotalBase, base) : formatMoney(0, base)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleTrade}
              disabled={loading}
              sx={{ 
                height: 56, 
                fontSize: '1.1rem',
                fontWeight: 700,
                background: isBuy 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                '&:hover': {
                  background: isBuy 
                    ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
                    : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : (isBuy ? t('trading.btn_buy') : t('trading.btn_sell'))}
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 3 }}>{success}</Alert>}
        </Paper>

        {/* Active Orders Section */}
        <Paper sx={{ mt: 4, p: 3, borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>{t('trading.pending_orders')}</Typography>
          {pendingOrders.length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t('trading.no_orders')}</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('trading.table_date')}</TableCell>
                    <TableCell>{t('trading.table_instrument')}</TableCell>
                    <TableCell>{t('trading.table_action')}</TableCell>
                    <TableCell>{t('trading.table_type')}</TableCell>
                    <TableCell align="right">{t('trading.table_target')}</TableCell>
                    <TableCell align="right">{t('trading.table_quantity')}</TableCell>
                    <TableCell align="center">{t('trading.table_cancel')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingOrders.map((po) => (
                    <TableRow key={po._id}>
                      <TableCell>{new Date(po.createdAt).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{po.symbol}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: po.side === "buy" ? "success.main" : "error.main", fontWeight: 700 }}>
                          {po.side === "buy" ? t('trading.table_action_buy') : t('trading.table_action_sell')}
                        </Typography>
                      </TableCell>
                      <TableCell>{t(`trading.type_${po.type}`)}</TableCell>
                  <TableCell align="right">{formatMoney(po.targetPrice, ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "XAGUSD"].includes(po.symbol) ? "USD" : "TRY")}</TableCell>
                      <TableCell align="right">{po.quantity}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => cancelOrder(po._id)}>
                          <Cancel fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Grid>

      <Grid xs={12} md={4}>
        <Paper sx={{ p: 4, borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
          <Box sx={{ 
            width: 64, height: 64, borderRadius: '50%', background: 'rgba(0, 212, 255, 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            border: '1px solid rgba(0, 212, 255, 0.3)'
          }}>
            <AccountBalanceWallet sx={{ fontSize: 32, color: '#00d4ff' }} />
          </Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t('trading.available_balance')}
          </Typography>
          <Typography variant="h3" sx={{ mt: 1, mb: 4, fontWeight: 800, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {formatMoney(balance)}
          </Typography>

          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', textAlign: 'left' }}>
            {t('trading.load_balance')}
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            slotProps={{
              htmlInput: { min: 0, step: "any" }
            }}
            sx={{ mb: 2 }}
          />
          <Button
            variant="outlined"
            fullWidth
            onClick={handleDeposit}
            disabled={loading}
            sx={{ 
              height: 48,
              borderColor: 'rgba(0, 212, 255, 0.5)',
              color: '#00d4ff',
              '&:hover': {
                borderColor: '#00d4ff',
                background: 'rgba(0, 212, 255, 0.05)'
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('trading.add_balance')}
          </Button>
        </Paper>

        {/* Fiyat Alarmı */}
        <Paper sx={{ mt: 3, p: 3, borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <NotificationsActive sx={{ color: '#f59e0b' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('trading.price_alert')}</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {t('trading.alert_desc', { symbol: order.symbol })}
          </Typography>
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>{t('trading.condition')}</InputLabel>
            <Select
              value={alertCondition}
              onChange={(e) => setAlertCondition(e.target.value as any)}
              label={t('trading.condition')}
            >
              <MenuItem value="above">{t('trading.condition_above')}</MenuItem>
              <MenuItem value="below">{t('trading.condition_below')}</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            size="small"
            label={t('trading.target_price')}
            type="number"
            value={alertTarget}
            onChange={(e) => setAlertTarget(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
          />
          
          <Button
            variant="contained"
            fullWidth
            onClick={handleSetAlert}
            disabled={alertLoading}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              fontWeight: 700,
              '&:hover': { background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }
            }}
          >
            {alertLoading ? <CircularProgress size={24} color="inherit" /> : t('trading.set_alert')}
          </Button>
        </Paper>
      </Grid>
      
      {/* Checkout Modal for Balance Loading */}
      <CheckoutModal 
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        tier="Bakiye Yükleme"
        price={Number(depositAmount) || 0}
        onSuccess={handlePaymentSuccess}
      />

      {/* ZEN MODE FULLSCREEN OVERLAY */}
      {zenMode && (
        <Box sx={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: '#020617', // Very dark cinematic blue/black
          display: 'flex', flexDirection: 'column',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {/* Zen Header */}
          <Box sx={{ px: 4, py: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>{selectedMarket?.symbol}</Typography>
              <Typography variant="h6" sx={{ color: chartColor, fontWeight: 700 }}>{formatMoney(currentPrice, base)} ({selectedMarket?.change30d.toFixed(2)}%)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('trading.available_balance')}</Typography>
            <Typography variant="h5" sx={{ color: '#00d4ff', fontWeight: 900, fontFamily: 'monospace' }}>{formatMoney(balance)}</Typography>
              </Box>
              <IconButton onClick={() => setZenMode(false)} sx={{ color: 'text.secondary', background: 'rgba(255,255,255,0.05)', '&:hover': { color: '#fff', background: 'rgba(239, 68, 68, 0.2)' } }}>
                <FullscreenExit sx={{ fontSize: 36 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Zen Chart */}
          <Box sx={{ flex: 1, px: 4, py: 2, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="zenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" hide />
                <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.2)" tick={{ fill: '#64748b', fontSize: 14, fontWeight: 700 }} width={100} tickFormatter={(val) => formatMoney(val, base)} />
                <ChartTooltip
                  contentStyle={{ backgroundColor: 'rgba(2,6,23,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }}
                  itemStyle={{ color: chartColor, fontWeight: 900, fontSize: '1.2rem' }}
                  formatter={(val: number) => [formatMoney(val, base), t('trading.tooltip_price')]}
                  labelStyle={{ display: 'none' }}
                />
                <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={6} fill="url(#zenGradient)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>

          {/* Zen Controls */}
          <Box sx={{ p: 4, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 4, alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
            {/* Inputs */}
            <Box sx={{ flex: 1, display: 'flex', gap: 3 }}>
              <TextField
                label={t('trading.quantity')}
                type="number"
                variant="filled"
                value={order.quantity}
                onChange={(e) => setOrder({...order, quantity: e.target.value})}
                sx={{ maxWidth: 300, flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 2, '& .MuiInputBase-input': { color: '#fff', fontSize: '1.8rem', fontWeight: 800, py: 2 }, '& .MuiInputLabel-root': { color: 'text.secondary' } }}
                slotProps={{ htmlInput: { min: 0, step: "any" }, input: { disableUnderline: true } }}
              />
            </Box>
            
            {/* Big Action Buttons */}
            <Button
              variant="contained" onClick={() => handleTrade("buy")} disabled={loading}
              sx={{ height: 100, px: 6, fontSize: '2.5rem', fontWeight: 900, borderRadius: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 0 50px rgba(16, 185, 129, 0.4)', '&:hover': { background: '#10b981', boxShadow: '0 0 80px rgba(16, 185, 129, 0.6)', transform: 'scale(1.02)' }, transition: 'all 0.2s' }}
            >
              LONG
            </Button>
            <Button
              variant="contained" onClick={() => handleTrade("sell")} disabled={loading}
              sx={{ height: 100, px: 6, fontSize: '2.5rem', fontWeight: 900, borderRadius: '16px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)', '&:hover': { background: '#ef4444', boxShadow: '0 0 80px rgba(239, 68, 68, 0.6)', transform: 'scale(1.02)' }, transition: 'all 0.2s' }}
            >
              SHORT
            </Button>
          </Box>

          {/* Status Overlay */}
          {(error || success) && (
            <Box sx={{ position: 'fixed', top: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 10000, width: '100%', maxWidth: 600 }}>
              {error && <Alert severity="error" sx={{ mb: 1, background: 'rgba(239,68,68,0.95)', color: '#fff', fontSize: '1.2rem', fontWeight: 700, '& .MuiAlert-icon': { color: '#fff', fontSize: '2rem' } }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ background: 'rgba(16,185,129,0.95)', color: '#fff', fontSize: '1.2rem', fontWeight: 700, '& .MuiAlert-icon': { color: '#fff', fontSize: '2rem' } }}>{success}</Alert>}
            </Box>
          )}
        </Box>
      )}
    </Grid>
  );
}
