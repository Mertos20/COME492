import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { AuthUser } from "../types";
import { Container, Grid, Card, CardHeader, CardContent, CardActions, Typography, Button, CircularProgress, Alert, Box, List, ListItem, ListItemIcon, ListItemText, Chip, Paper } from "@mui/material";
import { Check } from '@mui/icons-material';

interface PricingPlan {
  tier: string;
  name: string;
  price: number;
  description: string;
}

interface SubscriptionPageProps {
  user: AuthUser | null;
  balance: number;
  onUpgrade: (newMembership: AuthUser["membership"]) => void;
}

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

const planFeatures: Record<string, string[]> = {
    bronze: ["Bronze uzman danışmanlık", "Basit piyasa analizleri", "Haftalık raporlar"],
    silver: ["Silver uzman danışmanlık", "Detaylı piyasa analizleri", "Günlük raporlar", "Özel tavsiyeler"],
    gold: ["Platinum uzman danışmanlık", "Kapsamlı piyasa analizleri", "Gerçek zamanlı destek", "Kişiselleştirilmiş yatırım stratejileri", "Özel etkinliklere davet"],
}

export default function SubscriptionPage({ user, balance, onUpgrade }: SubscriptionPageProps) {
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
      } catch {
        setError("Fiyatlandırma planları yüklenemedi.");
      }
    };
    loadPlans();
  }, []);

  if (!user || user.role !== "user") {
    return <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>;
  }

  const handlePurchase = async (tier: string) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post<{ membership: AuthUser["membership"]; balance: number; message: string }>(
        "/auth/membership",
        { tier }
      );
      setSuccess(res.data.message);
      onUpgrade(res.data.membership);
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "İşlem başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  const getMembershipLevel = (tier: string): number => {
    const levels: Record<string, number> = { free: 0, bronze: 1, silver: 2, gold: 3 };
    return levels[tier] || 0;
  };

  const currentUserLevel = getMembershipLevel(user.membership);

  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', my: 5 }}>
        <Typography variant="h3" component="h1" gutterBottom>portfol.io Premium</Typography>
        <Typography variant="h6" color="text.secondary">
          Uzman danışmanlık ve gelişmiş analiz araçlarına erişim için üyeliğinizi yükseltin.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={4} alignItems="flex-end">
        {plans.map((plan) => {
          const isCurrentPlan = user.membership === plan.tier;
          const planLevel = getMembershipLevel(plan.tier);
          const canUpgrade = planLevel > currentUserLevel;

          return (
            <Grid item key={plan.tier} xs={12} md={4}>
              <Card elevation={isCurrentPlan ? 8 : 3} sx={{ border: isCurrentPlan ? 2 : 0, borderColor: 'primary.main' }}>
                <CardHeader
                  title={plan.name}
                  subheader={plan.description}
                  titleTypographyProps={{ align: 'center', variant: 'h5' }}
                  subheaderTypographyProps={{ align: 'center' }}
                  action={isCurrentPlan ? <Chip label="Mevcut Plan" color="primary" /> : null}
                  sx={{ backgroundColor: (theme) => theme.palette.grey[200] }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mb: 2 }}>
                    <Typography component="h2" variant="h3" color="text.primary">
                      {formatMoney(plan.price)}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">/ay</Typography>
                  </Box>
                  <List>
                    {(planFeatures[plan.tier] || []).map((line) => (
                      <ListItem key={line} disableGutters>
                        <ListItemIcon sx={{minWidth: 'auto', mr: 1.5}}>
                          <Check color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={line} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant={isCurrentPlan ? "outlined" : "contained"}
                    onClick={() => handlePurchase(plan.tier)}
                    disabled={isCurrentPlan || loading || !canUpgrade || balance < plan.price}
                  >
                    {loading ? <CircularProgress size={24} /> : (isCurrentPlan ? "Mevcut Plan" : (canUpgrade ? "Satın Al" : "Yükseltilemez"))}
                  </Button>
                </CardActions>
                {balance < plan.price && !isCurrentPlan && canUpgrade && (
                  <Alert severity="warning" sx={{ m: 2 }}>
                    Yetersiz bakiye! {formatMoney(plan.price - balance)} daha eklemeniz gerekiyor.
                  </Alert>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
      
      <Paper elevation={3} sx={{ p: 3, mt: 5, textAlign: 'center' }}>
        <Typography variant="h6">Mevcut Bakiyeniz</Typography>
        <Typography variant="h4" color="primary" sx={{ my: 1 }}>{formatMoney(balance)}</Typography>
        <Button variant="contained" onClick={() => navigate("/trading")}>Bakiye Yükle</Button>
      </Paper>
    </Container>
  );
}
