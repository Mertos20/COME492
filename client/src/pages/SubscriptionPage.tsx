import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { AuthUser } from "../types";
import { Container, Grid, Card, CardHeader, CardContent, CardActions, Typography, Button, CircularProgress, Alert, Box, List, ListItem, ListItemIcon, ListItemText, Chip } from "@mui/material";
import { Check, Star, WorkspacePremium } from '@mui/icons-material';

interface PricingPlan { tier: string; name: string; price: number; description: string; }

interface SubscriptionPageProps {
  user: AuthUser | null;
  balance: number;
  onUpgrade: (newMembership: AuthUser["membership"]) => void;
  onBalanceChange?: (newBalance: number) => void;
}

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

const planFeatures: Record<string, string[]> = {
  bronze: ["Bronze uzman danışmanlık", "Basit piyasa analizleri", "Haftalık raporlar"],
  silver: ["Silver uzman danışmanlık", "Detaylı piyasa analizleri", "Günlük raporlar", "Özel tavsiyeler"],
  gold: ["Gold uzman danışmanlık", "Kapsamlı piyasa analizleri", "Gerçek zamanlı destek", "Kişiselleştirilmiş yatırım stratejileri", "Özel etkinliklere davet"],
};

const tierGradients: Record<string, { bg: string; border: string; accent: string; glow: string }> = {
  bronze: { bg: 'linear-gradient(135deg, rgba(205,127,50,0.08) 0%, rgba(205,127,50,0.02) 100%)', border: 'rgba(205,127,50,0.25)', accent: '#cd7f32', glow: '0 0 30px rgba(205,127,50,0.15)' },
  silver: { bg: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(192,192,192,0.02) 100%)', border: 'rgba(192,192,192,0.25)', accent: '#c0c0c0', glow: '0 0 30px rgba(192,192,192,0.15)' },
  gold: { bg: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,140,0,0.04) 100%)', border: 'rgba(255,215,0,0.3)', accent: '#ffd700', glow: '0 0 40px rgba(255,215,0,0.2)' },
};

export default function SubscriptionPage({ user, balance, onUpgrade, onBalanceChange }: SubscriptionPageProps) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await api.get<{ plans: PricingPlan[] }>("/auth/pricing");
        setPlans(res.data.plans);
      } catch { setError("Fiyatlandırma planları yüklenemedi."); }
    };
    loadPlans();
  }, []);

  if (!user || user.role !== "user") {
    return <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>;
  }

  const handlePurchase = async (tier: string) => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await api.post<{ membership: AuthUser["membership"]; balance: number; message: string }>("/auth/membership", { tier });
      setSuccess(res.data.message);
      onUpgrade(res.data.membership);
      if (onBalanceChange) onBalanceChange(res.data.balance);
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "İşlem başarısız oldu.");
    } finally { setLoading(false); }
  };

  const getMembershipLevel = (tier: string): number => {
    const levels: Record<string, number> = { free: 0, bronze: 1, silver: 2, gold: 3 };
    return levels[tier] || 0;
  };

  const currentUserLevel = getMembershipLevel(user.membership);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '16px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #00d4ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(124, 58, 237, 0.3)',
          }}>
            <WorkspacePremium sx={{ color: '#fff', fontSize: 32 }} />
          </Box>
        </Box>
        <Typography variant="h3" sx={{
          fontWeight: 900,
          background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 50%, #ffd700 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          mb: 1,
        }}>
          portfol.io Premium
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 500, mx: 'auto' }}>
          Uzman danışmanlık ve gelişmiş analiz araçlarına erişim için üyeliğinizi yükseltin.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {/* Plans */}
      <Grid container spacing={3} sx={{ mb: 5, alignItems: "stretch" }}>
        {plans.map((plan, index) => {
          const isCurrentPlan = user.membership === plan.tier;
          const planLevel = getMembershipLevel(plan.tier);
          const canUpgrade = planLevel > currentUserLevel;
          const style = tierGradients[plan.tier] || tierGradients.bronze;
          const isGold = plan.tier === 'gold';

          return (
            <Grid key={plan.tier} item xs={12} md={4}>
              <Card elevation={0} sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                background: style.bg,
                border: isCurrentPlan ? `2px solid ${style.accent}` : `1px solid ${style.border}`,
                animation: 'slideUp 0.5s ease-out forwards',
                animationDelay: `${index * 0.1}s`, opacity: 0,
                position: 'relative', overflow: 'visible',
                ...(isGold && { boxShadow: style.glow }),
                '&:hover': { boxShadow: style.glow, transform: 'translateY(-4px)' },
              }}>
                {isCurrentPlan && (
                  <Chip label="Mevcut Plan" size="small" sx={{
                    position: 'absolute', top: -12, right: 16,
                    background: `linear-gradient(135deg, ${style.accent}, ${style.accent}cc)`,
                    color: '#0a0e27', fontWeight: 700, fontSize: '0.7rem',
                  }} />
                )}
                {isGold && !isCurrentPlan && (
                  <Chip icon={<Star sx={{ fontSize: '0.9rem !important', color: '#0a0e27 !important' }} />} label="Popüler" size="small" sx={{
                    position: 'absolute', top: -12, left: 16,
                    background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                    color: '#0a0e27', fontWeight: 700, fontSize: '0.7rem',
                  }} />
                )}
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: style.accent, mb: 0.5 }}>{plan.name}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>{plan.description}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary' }}>{formatMoney(plan.price)}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', ml: 0.5 }}>/ay</Typography>
                  </Box>
                  <List disablePadding>
                    {(planFeatures[plan.tier] || []).map(line => (
                      <ListItem key={line} disableGutters sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                          <Check sx={{ color: style.accent, fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText primary={line} slotProps={{ primary: { variant: 'body2', sx: { color: 'text.secondary' } } }} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button fullWidth variant="contained" onClick={() => handlePurchase(plan.tier)}
                    disabled={isCurrentPlan || loading || !canUpgrade || balance < plan.price}
                    sx={{
                      py: 1.5, fontWeight: 700,
                      background: isCurrentPlan ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${style.accent}, ${style.accent}cc)`,
                      color: isCurrentPlan ? 'text.secondary' : '#0a0e27',
                      '&:hover': { background: `linear-gradient(135deg, ${style.accent}ee, ${style.accent})` },
                      '&.Mui-disabled': { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' },
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : (isCurrentPlan ? "Mevcut Plan" : (canUpgrade ? "Satın Al" : "Yükseltilemez"))}
                  </Button>
                </CardActions>
                {balance < plan.price && !isCurrentPlan && canUpgrade && (
                  <Alert severity="warning" sx={{ m: 2, mt: 0 }}>
                    Yetersiz bakiye! {formatMoney(plan.price - balance)} daha eklemeniz gerekiyor.
                  </Alert>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Balance Info */}
      <Box sx={{
        p: 3, borderRadius: '16px', textAlign: 'center',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}>Mevcut Bakiyeniz</Typography>
        <Typography variant="h4" sx={{
          fontWeight: 800, mb: 2,
          background: 'linear-gradient(135deg, #00d4ff, #10b981)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {formatMoney(balance)}
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/load-balance")} sx={{ borderColor: 'rgba(0,212,255,0.3)', color: '#00d4ff' }}>
          Bakiye Yükle
        </Button>
      </Box>
    </Box>
  );
}
