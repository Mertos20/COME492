import { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Paper, Grid, Avatar, List, ListItem, ListItemAvatar, ListItemText, Select, MenuItem, CircularProgress } from "@mui/material";
import { TrendingUp, TrendingDown, Radar, Leaderboard, OfflineBolt, AccessTime } from "@mui/icons-material";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "../api";
import { useMarket } from "../contexts/MarketContext";
import { useTranslation } from "react-i18next";

export default function GamePage() {
  const { instruments } = useMarket();
  const { t } = useTranslation();
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
    <Box sx={{ maxWidth: 1400, mx: "auto", py: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <Radar sx={{ color: "#00d4ff", fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>{t('game.title')}</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
        {t('game.description')}
      </Typography>

      <Grid container spacing={3}>
        {/* Score Board */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', textAlign: 'center' }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, letterSpacing: '0.05em' }}>{t('game.score')}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#e2e8f0' }}>{score}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', textAlign: 'center' }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, letterSpacing: '0.05em' }}>{t('game.streak')}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <OfflineBolt sx={{ color: streak > 2 ? '#00d4ff' : 'text.secondary', fontSize: 32, animation: streak > 2 ? 'pulse 2s infinite' : 'none' }} />
              <Typography variant="h4" sx={{ fontWeight: 800, color: streak > 2 ? '#00d4ff' : 'text.primary' }}>x{streak}</Typography>
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
                <MenuItem value="BTCUSDT">{t('game.inst_btc')}</MenuItem>
                <MenuItem value="ETHUSDT">{t('game.inst_eth')}</MenuItem>
                <MenuItem value="XAUUSD">{t('game.inst_xau')}</MenuItem>
                <MenuItem value="USDTRY">{t('game.inst_usd')}</MenuItem>
              </Select>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>
                {currentInst ? formatMoney(currentInst.price, currentInst.symbol) : '...'}
              </Typography>
            </Box>

            {/* Result Overlay */}
            {gameResult.status && (
              <Box sx={{
                position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10,
                background: gameResult.status === 'won' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${gameResult.status === 'won' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                px: 4, py: 2, borderRadius: '12px', backdropFilter: 'blur(20px)',
                animation: 'scaleIn 0.3s ease-out', boxShadow: `0 10px 40px ${gameResult.status === 'won' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
              }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: gameResult.status === 'won' ? '#10b981' : '#ef4444', textAlign: 'center', letterSpacing: '0.05em' }}>
                  {gameResult.status === 'won' ? t('game.trade_won') : t('game.trade_lost')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center', mt: 0.5 }}>
                  {gameResult.points > 0 ? '+' : ''}{gameResult.points} {t('game.points')}
                </Typography>
              </Box>
            )}

            <Box sx={{ height: 380, width: '100%' }}>
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
                py: 2, fontSize: '1.1rem', fontWeight: 800,
                background: 'rgba(16,185,129,0.1)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
                boxShadow: 'none',
                '&:hover': { background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.5)' },
                '&.Mui-disabled': { background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.05)' }
              }}
            >
              <TrendingUp sx={{ mr: 1, fontSize: 24 }} /> {t('game.btn_long')}
            </Button>

            {isWaitingTick ? (
              <Box sx={{ px: 2, textAlign: 'center' }}>
                <CircularProgress size={24} sx={{ color: '#7c3aed', mb: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', lineHeight: 1.2, letterSpacing: '0.05em', whiteSpace: 'pre-line' }}>{t('game.waiting_data')}</Typography>
              </Box>
            ) : (
              <Box sx={{ px: 2, textAlign: 'center' }}>
                <AccessTime sx={{ color: 'text.secondary', fontSize: 24, opacity: 0.3 }} />
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              disabled={isWaitingTick || !currentInst}
              onClick={() => handlePredict('down')}
              sx={{
                py: 2, fontSize: '1.1rem', fontWeight: 800,
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)',
                boxShadow: 'none',
                '&:hover': { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)' },
                '&.Mui-disabled': { background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.05)' }
              }}
            >
              <TrendingDown sx={{ mr: 1, fontSize: 24 }} /> {t('game.btn_short')}
            </Button>
          </Box>
        </Grid>

        {/* Leaderboard */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', height: '100%', minHeight: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Leaderboard sx={{ color: '#00d4ff', fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('game.global_ranking')}</Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {leaderboard.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  {t('game.no_scores')}
                </Typography>
              ) : (
                leaderboard.map((player, index) => (
                  <ListItem key={player.id} sx={{ px: 1, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{ 
                        width: 28, height: 28, fontSize: '0.8rem', fontWeight: 800,
                        background: 'rgba(255,255,255,0.05)',
                        border: index === 0 ? '1px solid #ffd700' : 
                                index === 1 ? '1px solid #c0c0c0' : 
                                index === 2 ? '1px solid #cd7f32' : '1px solid rgba(255,255,255,0.1)',
                        color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'text.secondary'
                      }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 700, color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'text.primary' }}>{player.userName}</Typography>}
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