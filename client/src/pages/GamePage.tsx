import { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Paper, Grid, Avatar, List, ListItem, ListItemAvatar, ListItemText, Select, MenuItem, CircularProgress } from "@mui/material";
import { TrendingUp, TrendingDown, AutoAwesome, SportsEsports, LocalFireDepartment, EmojiEvents } from "@mui/icons-material";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "../api";
import { useMarket } from "../contexts/MarketContext";

export default function GamePage() {
  const { instruments } = useMarket();
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [historyState, setHistoryState] = useState<{symbol: string, data: {time: string, price: number}[]}>({ symbol: "BTCUSDT", data: [] });

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isWaitingTick, setIsWaitingTick] = useState(false);
  const [gameResult, setGameResult] = useState<{ status: 'won' | 'lost' | null; points: number }>({ status: null, points: 0 });
  const [leaderboard, setLeaderboard] = useState<{id: string, userName: string, score: number}[]>([]);

  const predictionRef = useRef<{ dir: 'up' | 'down'; price: number } | null>(null);
  const currentInst = instruments.find(i => i.symbol === selectedSymbol);

  // Liderlik tablosunu arka uçtan çek
  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/game/leaderboard');
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      console.error("Liderlik tablosu alınamadı", err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Her 10 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  // Skorumuz arttığında sunucuya gönder
  useEffect(() => {
    if (score > 0) {
      api.post('/game/score', { score }).catch(console.error);
    }
  }, [score]);

  useEffect(() => {
    if (!currentInst) return;

    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;

    setHistoryState(prev => {
      if (prev.symbol !== currentInst.symbol) return prev;
      
      const data = prev.data;
      if (data.length === 0) {
        const seed = Array.from({ length: 15 }).map((_, i) => ({ time: `-${(15 - i)*15}s`, price: currentInst.price }));
        return { symbol: prev.symbol, data: seed };
      }

      const last = data[data.length - 1];
      if (last && last.time === timeLabel) return prev; 

      return { symbol: prev.symbol, data: [...data.slice(-19), { time: timeLabel, price: currentInst.price }] };
    });

    if (predictionRef.current) {
      const pred = predictionRef.current;
      if (currentInst.price !== pred.price) {
        const isUp = currentInst.price > pred.price;
        const isDown = currentInst.price < pred.price;

        if ((pred.dir === 'up' && isUp) || (pred.dir === 'down' && isDown)) {
          setStreak(prevStreak => {
            const newStreak = prevStreak + 1;
            setScore(s => {
              const bonus = Math.min(newStreak * 5, 50); // Gerçek piyasada kombo daha zor, o yüzden +50'ye kadar bonus
              const earned = 20 + bonus;
              setGameResult({ status: 'won', points: earned });
              return s + earned;
            });
            return newStreak;
          });
        } else {
          setStreak(0);
          setScore(s => {
            setGameResult({ status: 'lost', points: -10 });
            return s - 10;
          });
        }
        predictionRef.current = null;
        setIsWaitingTick(false);
      }
    }
  }, [instruments, currentInst]);

  const handleSymbolChange = (val: string) => {
    setSelectedSymbol(val);
    setHistoryState({ symbol: val, data: [] });
    predictionRef.current = null;
    setIsWaitingTick(false);
    setGameResult({ status: null, points: 0 });
  };

  const handlePredict = (dir: 'up' | 'down') => {
    if (!currentInst || isWaitingTick) return; 
    predictionRef.current = { dir, price: currentInst.price };
    setIsWaitingTick(true);
    setGameResult({ status: null, points: 0 });
  };

  const formatMoney = (val: number, sym: string) => {
    const isUsd = sym.endsWith("USDT") || sym.endsWith("USD");
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: isUsd ? "USD" : "TRY", minimumFractionDigits: val < 100 ? 4 : 2 }).format(val);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <SportsEsports sx={{ color: "#f59e0b", fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Borsa Kahini</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
        Canlı piyasa verileriyle önümüzdeki ilk fiyat değişiminin yönünü tahmin et, kombo yap, liderlik tablosuna tırman! (Veriler 15 saniyede bir güncellenir)
      </Typography>

      <Grid container spacing={3}>
        {/* Score Board */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', textAlign: 'center' }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1 }}>TOPLAM PUAN</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#00d4ff' }}>{score}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', textAlign: 'center' }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1 }}>MEVCUT SERİ (COMBO)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <LocalFireDepartment sx={{ color: streak > 2 ? '#ef4444' : '#f59e0b', fontSize: 36, animation: streak > 2 ? 'pulse 1s infinite' : 'none' }} />
              <Typography variant="h3" sx={{ fontWeight: 900, color: streak > 2 ? '#ef4444' : '#f59e0b' }}>x{streak}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Live Chart & Controls */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, background: 'rgba(17,22,56,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Select
                value={selectedSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                variant="standard"
                disableUnderline
                sx={{ 
                  color: '#e2e8f0', fontWeight: 800, fontSize: '1.25rem',
                  '.MuiSelect-icon': { color: '#e2e8f0' }
                }}
              >
                <MenuItem value="BTCUSDT">Bitcoin (BTC)</MenuItem>
                <MenuItem value="ETHUSDT">Ethereum (ETH)</MenuItem>
                <MenuItem value="XAUUSD">Ons Altın (XAU)</MenuItem>
                <MenuItem value="USDTRY">Dolar/TL (USD)</MenuItem>
              </Select>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>
                {currentInst ? formatMoney(currentInst.price, currentInst.symbol) : '...'}
              </Typography>
            </Box>

            {/* Result Overlay */}
            {gameResult.status && (
              <Box sx={{
                position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10,
                background: gameResult.status === 'won' ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)',
                px: 4, py: 2, borderRadius: '16px', backdropFilter: 'blur(10px)',
                animation: 'scaleIn 0.3s ease-out', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff', textAlign: 'center' }}>
                  {gameResult.status === 'won' ? 'HARİKA TAHMİN!' : 'YANLIŞ TAHMİN'}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
                  {gameResult.points > 0 ? '+' : ''}{gameResult.points} Puan
                </Typography>
              </Box>
            )}

            <Box sx={{ height: 250, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyState.data}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} width={60} stroke="rgba(255,255,255,0.2)" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111638', borderColor: 'rgba(255,255,255,0.1)' }} itemStyle={{ color: '#10b981' }} />
                  <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3 }}>
            <Button
              fullWidth
              variant="contained"
              disabled={isWaitingTick || !currentInst}
              onClick={() => handlePredict('up')}
              sx={{
                py: 2, fontSize: '1.2rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 8px 25px rgba(16,185,129,0.2)',
                '&:hover': { background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' }
              }}
            >
              <TrendingUp sx={{ mr: 1, fontSize: 28 }} /> YÜKSELİR
            </Button>

            {isWaitingTick ? (
              <Box sx={{ px: 4, textAlign: 'center' }}>
                <CircularProgress size={32} sx={{ color: '#00d4ff', mb: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', lineHeight: 1.2 }}>PİYASA<br/>BEKLENİYOR</Typography>
              </Box>
            ) : (
              <Box sx={{ px: 4, textAlign: 'center' }}>
                <AutoAwesome sx={{ color: 'text.secondary', fontSize: 32, opacity: 0.5 }} />
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              disabled={isWaitingTick || !currentInst}
              onClick={() => handlePredict('down')}
              sx={{
                py: 2, fontSize: '1.2rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: '0 8px 25px rgba(239,68,68,0.2)',
                '&:hover': { background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' }
              }}
            >
              <TrendingDown sx={{ mr: 1, fontSize: 28 }} /> DÜŞER
            </Button>
          </Box>
        </Grid>

        {/* Leaderboard */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', height: '100%', minHeight: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <EmojiEvents sx={{ color: '#ffd700', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Liderlik Tablosu</Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {leaderboard.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  Henüz kimse skor kaydetmedi. İlk sen ol!
                </Typography>
              ) : (
                leaderboard.map((player, index) => (
                  <ListItem key={player.id} sx={{ px: 1, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{ 
                        width: 28, height: 28, fontSize: '0.8rem', fontWeight: 800,
                        background: index === 0 ? 'linear-gradient(135deg, #ffd700, #f59e0b)' : 
                                    index === 1 ? 'linear-gradient(135deg, #c0c0c0, #94a3b8)' : 
                                    index === 2 ? 'linear-gradient(135deg, #cd7f32, #b45309)' : 
                                    'rgba(255,255,255,0.1)',
                        color: index < 3 ? '#000' : '#fff'
                      }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 700, color: index === 0 ? '#ffd700' : 'text.primary' }}>{player.userName}</Typography>}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#00d4ff' }}>
                      {player.score}
                    </Typography>
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}