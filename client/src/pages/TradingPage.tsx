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
  AccountBalanceWallet, SwapHoriz, TrendingUp, TrendingDown, Cancel, NotificationsActive 
} from "@mui/icons-material";
import LoadingSkeleton from "../components/LoadingSkeleton";
import CheckoutModal from "../components/CheckoutModal";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

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
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Alert state
  const [alertTarget, setAlertTarget] = useState("");
  const [alertCondition, setAlertCondition] = useState<"above" | "below">("above");
  const [alertLoading, setAlertLoading] = useState(false);

  useEffect(() => {
    if (markets.length > 0 && !order.symbol) {
      setOrder((prev) => ({ ...prev, symbol: markets[0].symbol }));
    }
  }, [markets, order.symbol]);

  const loadOrders = async () => {
    try {
      const res = await api.get<PendingOrder[]>("/trade/orders");
      setPendingOrders(res.data);
    } catch (err) {
      console.error("Bekleyen emirler yüklenemedi", err);
    }
  };

  useEffect(() => {
    loadOrders();
    // Refresh pending orders periodically
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      setError("Geçerli bir tutar girin.");
      return;
    }
    setCheckoutOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setCheckoutOpen(false);
    setError("");
    setSuccess(`${formatMoney(Number(depositAmount))} başarıyla yüklendi!`);
    setDepositAmount("10000");
    onTradeComplete(); // Refresh balance from server
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleSetAlert = async () => {
    if (!alertTarget || Number(alertTarget) <= 0) {
      setError("Geçerli bir alarm fiyatı girin.");
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
      setSuccess(`${order.symbol} için fiyat alarmı kuruldu!`);
      setAlertTarget("");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Alarm kurulamadı.");
    } finally {
      setAlertLoading(false);
    }
  };

  const handleTrade = async () => {
    const quantity = Number(order.quantity);
    if (!quantity || quantity <= 0) {
      setError("Geçerli bir miktar girin.");
      return;
    }

    const targetPrice = Number(order.targetPrice);
    if (order.type !== "market" && (!targetPrice || targetPrice <= 0)) {
      setError("Geçerli bir hedef fiyat girin.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/trade/order", {
        side: order.side,
        symbol: order.symbol,
        quantity,
        type: order.type,
        targetPrice: order.type === "market" ? undefined : targetPrice
      });
      setSuccess(res.data.message || "İşlem başarılı!");
      onTradeComplete();
      loadOrders(); // Refresh orders if it was a limit/stop order
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      await api.delete(`/trade/orders/${id}`);
      setSuccess("Emir başarıyla iptal edildi.");
      onTradeComplete(); // Refund updates balance
      loadOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || "Emir iptal edilemedi.");
    }
  };

  if (pageLoading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  const selectedMarket = markets.find(m => m.symbol === order.symbol);
  const currentPrice = selectedMarket ? selectedMarket.price : 0;
  const isBuy = order.side === "buy";
  const estimatedTotal = order.type === "market" 
    ? currentPrice * Number(order.quantity) 
    : Number(order.targetPrice) * Number(order.quantity);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 4, borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHoriz color="primary" /> Hızlı Al/Sat
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
                AL (BUY)
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
                SAT (SELL)
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Ürün</InputLabel>
                <Select
                  value={order.symbol}
                  onChange={(e) => setOrder({ ...order, symbol: e.target.value })}
                  label="Ürün"
                >
                  {markets.map((m) => (
                    <MenuItem key={m.symbol} value={m.symbol}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{m.symbol} - {m.name}</span>
                        <span style={{ opacity: 0.7 }}>{formatMoney(m.price)}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Emir Tipi</InputLabel>
                <Select
                  value={order.type}
                  onChange={(e) => setOrder({ ...order, type: e.target.value as any })}
                  label="Emir Tipi"
                >
                  <MenuItem value="market">Piyasa (Market)</MenuItem>
                  <MenuItem value="limit">Limit (Hedef Fiyat)</MenuItem>
                  <MenuItem value="stop">Stop-Loss (Zarar Kes)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={order.type !== "market" ? 6 : 12}>
              <TextField
                fullWidth
                label="Miktar"
                type="number"
                value={order.quantity}
                onChange={(e) => setOrder({ ...order, quantity: e.target.value })}
                slotProps={{
                  input: { inputProps: { min: 0, step: 0.01 } }
                }}
              />
            </Grid>

            {order.type !== "market" && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hedef Fiyat (TRY)"
                  type="number"
                  value={order.targetPrice}
                  onChange={(e) => setOrder({ ...order, targetPrice: e.target.value })}
                  slotProps={{
                    input: { inputProps: { min: 0, step: 0.01 } }
                  }}
                />
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 4, p: 3, borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item>
                <Typography variant="body2" color="text.secondary">Güncel Fiyat</Typography>
                <Typography variant="h6">{formatMoney(currentPrice)}</Typography>
              </Grid>
              <Grid item sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  {order.type === "market" ? "Tahmini Toplam Tutar" : "Rezerve Edilecek Tutar"}
                </Typography>
                <Typography variant="h5" sx={{ color: isBuy ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                  {!isNaN(estimatedTotal) && estimatedTotal > 0 ? formatMoney(estimatedTotal) : "0,00 ₺"}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : (isBuy ? "Satın Al" : "Sat")}
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 3 }}>{success}</Alert>}
        </Paper>

        {/* Active Orders Section */}
        <Paper sx={{ mt: 4, p: 3, borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Bekleyen Emirler</Typography>
          {pendingOrders.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Bekleyen açık emriniz bulunmuyor.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tarih</TableCell>
                    <TableCell>Ürün</TableCell>
                    <TableCell>İşlem</TableCell>
                    <TableCell>Tip</TableCell>
                    <TableCell align="right">Hedef Fiyat</TableCell>
                    <TableCell align="right">Miktar</TableCell>
                    <TableCell align="center">İptal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingOrders.map((po) => (
                    <TableRow key={po._id}>
                      <TableCell>{new Date(po.createdAt).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{po.symbol}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: po.side === "buy" ? "success.main" : "error.main", fontWeight: 700 }}>
                          {po.side === "buy" ? "AL" : "SAT"}
                        </Typography>
                      </TableCell>
                      <TableCell>{po.type.toUpperCase()}</TableCell>
                      <TableCell align="right">{formatMoney(po.targetPrice)}</TableCell>
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

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 4, borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
          <Box sx={{ 
            width: 64, height: 64, borderRadius: '50%', background: 'rgba(0, 212, 255, 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            border: '1px solid rgba(0, 212, 255, 0.3)'
          }}>
            <AccountBalanceWallet sx={{ fontSize: 32, color: '#00d4ff' }} />
          </Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Kullanılabilir Bakiye
          </Typography>
          <Typography variant="h3" sx={{ mt: 1, mb: 4, fontWeight: 800, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatMoney(balance)}
          </Typography>

          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', textAlign: 'left' }}>
            Bakiye Yükle
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            slotProps={{
              input: { inputProps: { min: 0 } }
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
            {loading ? <CircularProgress size={24} color="inherit" /> : "Bakiye Ekle"}
          </Button>
        </Paper>

        {/* Fiyat Alarmı */}
        <Paper sx={{ mt: 3, p: 3, borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <NotificationsActive sx={{ color: '#f59e0b' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Fiyat Alarmı</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {order.symbol} fiyatı belirlediğiniz seviyeye geldiğinde bildirim alın.
          </Typography>
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Koşul</InputLabel>
            <Select
              value={alertCondition}
              onChange={(e) => setAlertCondition(e.target.value as any)}
              label="Koşul"
            >
              <MenuItem value="above">Fiyat Üstüne Çıkarsa</MenuItem>
              <MenuItem value="below">Fiyat Altına Düşerse</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            size="small"
            label="Hedef Fiyat (TRY)"
            type="number"
            value={alertTarget}
            onChange={(e) => setAlertTarget(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
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
            {alertLoading ? <CircularProgress size={24} color="inherit" /> : "Alarm Kur"}
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
    </Grid>
  );
}
