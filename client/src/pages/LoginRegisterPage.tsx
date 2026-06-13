import { useState, FormEvent, useEffect } from "react";
import type { AuthUser } from "../types";
import { api, setApiToken } from "../api";
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from "@mui/material";
import { TrendingUp, Person, AdminPanelSettings, Email, Lock, Badge, SmartToy, AccessTime, ShowChart } from "@mui/icons-material";

interface LoginRegisterPageProps {
  onAuthSuccess: (token: string, user: AuthUser, balance: number) => void;
}

export default function LoginRegisterPage({ onAuthSuccess }: LoginRegisterPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [panelMode, setPanelMode] = useState<"user" | "expert">("user");
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0: Normal, 1: Email, 2: Code
  const [resetData, setResetData] = useState({ email: "", code: "", newPassword: "" });
  const [simulationCode, setSimulationCode] = useState("");
  const [wordIndex, setWordIndex] = useState(0);

  const plans = ["free", "bronze", "silver", "gold"] as const;
  const dynamicWords = ["Platformu", "Asistanı", "Ekosistemi", "Rehberi"];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % dynamicWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const normalizeUser = (raw: Partial<AuthUser>): AuthUser => ({
    id: raw.id || "",
    fullName: raw.fullName || "Kullanici",
    email: raw.email || "",
    role: raw.role === "expert" ? "expert" : "user",
    membership: raw.membership && plans.includes(raw.membership) ? raw.membership : "free",
    isAdmin: raw.isAdmin || false
  });

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login"
          ? { email: authForm.email, password: authForm.password }
          : { fullName: authForm.fullName, email: authForm.email, password: authForm.password };

      const res = await api.post<{ token: string; user: AuthUser; balance: number }>(endpoint, payload);

      if (panelMode === "expert" && res.data.user.role !== "expert") {
        setError("Bu panel sadece uzman girişi içindir.");
        setLoading(false);
        return;
      }

      const token = res.data.token;
      localStorage.setItem("token", token);
      setApiToken(token);

      const safeUser = normalizeUser(res.data.user);
      setAuthForm({ fullName: "", email: "", password: "" });

      onAuthSuccess(token, safeUser, res.data.balance);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const errorData = (err as any).response?.data;
        setError(errorData?.message || "Giriş işlemi başarısız. Lütfen bilgilerinizi kontrol edin.");
      } else {
        setError("Giriş işlemi başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: resetData.email });
      setSuccess(res.data.message);
      setSimulationCode(res.data.simulationCode || "");
      setForgotPasswordStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePerformReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", resetData);
      setSuccess(res.data.message);
      setTimeout(() => {
        setForgotPasswordStep(0);
        setResetData({ email: "", code: "", newPassword: "" });
        setAuthForm({ fullName: "", email: "", password: "" });
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePanelModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newPanelMode: string | null,
  ) => {
    if (newPanelMode !== null) {
      setPanelMode(newPanelMode as "user" | "expert");
      setMode("login"); // Reset to login when switching panels
      setError("");
    }
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      transition: 'all 0.3s ease',
      '&.Mui-focused': {
        boxShadow: '0 0 15px rgba(0, 212, 255, 0.15)',
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0e27 0%, #111638 50%, #0a0e27 100%)',
      }}
    >
      {/* Animated Background Orbs */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />

      {/* Left Side - Brand */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 6,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ animation: 'slideUp 0.8s ease-out', maxWidth: 480 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
              }}
            >
              <TrendingUp sx={{ color: '#fff', fontSize: 32 }} />
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              portfol.io
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#e2e8f0',
              mb: 2,
              lineHeight: 1.3,
            }}
          >
            Geleceğin Yatırım
            <br />
            <Box component="span" sx={{ display: 'inline-block', minWidth: '220px' }}>
              <span
                key={wordIndex}
                style={{
                  background: 'linear-gradient(135deg, #00d4ff, #10b981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                  animation: 'scaleIn 0.5s ease-out',
                }}
              >
                {dynamicWords[wordIndex]}
              </span>
            </Box>
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#94a3b8',
              lineHeight: 1.8,
              mb: 4,
              maxWidth: 400,
            }}
          >
            Kripto, döviz, altın ve gümüş piyasalarını gerçek zamanlı takip edin.
            AI destekli danışmanlık ve uzman rehberliği ile yatırımlarınızı yönetin.
          </Typography>

          <Box sx={{ display: 'flex', gap: 3 }}>
            {[
              { label: 'Aktif Piyasa', value: '20+', icon: <ShowChart sx={{ color: '#00d4ff', fontSize: 24, mb: 1 }} /> },
              { label: 'Canlı Veri', value: '7/24', icon: <AccessTime sx={{ color: '#10b981', fontSize: 24, mb: 1 }} /> },
              { label: 'AI Danışman', value: '+portfol.ai', icon: <SmartToy sx={{ color: '#7c3aed', fontSize: 24, mb: 1 }} /> },
            ].map((stat, i) => (
              <Box
                key={stat.label}
                sx={{
                  p: 2.5,
                  minWidth: 110,
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  animation: `slideUp 0.5s ease-out ${0.4 + i * 0.1}s backwards`,
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    background: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    boxShadow: '0 10px 25px rgba(0, 212, 255, 0.1)',
                  }
                }}
              >
                {stat.icon}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right Side - Form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 480px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 4 },
          py: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 440,
            p: { xs: 3, sm: 4 },
            background: 'rgba(17, 22, 56, 0.85)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            animation: 'scaleIn 0.5s ease-out',
          }}
        >
          {forgotPasswordStep === 0 ? (
            <>
              {/* Mobile Logo */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp sx={{ color: '#fff', fontSize: 24 }} />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  portfol.io
                </Typography>
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'center' }}>
                {mode === 'login' ? 'Tekrar Hoş Geldiniz' : 'Hesap Oluşturun'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, textAlign: 'center' }}>
                {mode === 'login' ? 'Hesabınıza giriş yapın' : 'Yeni hesabınızı oluşturun'}
              </Typography>

              {/* Panel Mode Toggle */}
              <ToggleButtonGroup
                color="primary"
                value={panelMode}
                exclusive
                onChange={handlePanelModeChange}
                aria-label="Panel Modu"
                fullWidth
                sx={{
                  mb: 3,
                  '& .MuiToggleButton-root': {
                    py: 1,
                    fontSize: '0.8rem',
                    gap: 0.5,
                  },
                }}
              >
                <ToggleButton value="user">
                  <Person sx={{ fontSize: '1rem' }} /> Kullanıcı
                </ToggleButton>
                <ToggleButton value="expert">
                  <AdminPanelSettings sx={{ fontSize: '1rem' }} /> Uzman
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Login / Register Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.06)', mb: 3 }}>
                <Tabs
                  value={mode}
                  onChange={(e, newValue) => setMode(newValue)}
                  centered
                  sx={{
                    '& .MuiTab-root': { py: 1.5 },
                  }}
                >
                  <Tab label="Giriş Yap" value="login" />
                  {panelMode === 'user' && <Tab label="Kayıt Ol" value="register" />}
                </Tabs>
              </Box>

              {/* Auth Form */}
              <Box component="form" onSubmit={handleAuth}>
                {mode === 'register' && panelMode === 'user' && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="fullName"
                    label="Ad Soyad"
                    name="fullName"
                    autoComplete="name"
                    autoFocus
                    value={authForm.fullName}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, fullName: e.target.value }))}
                    slotProps={{
                      input: {
                        startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />,
                      }
                    }}
                  sx={inputStyles}
                  />
                )}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="E-posta Adresi"
                  name="email"
                  autoComplete="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  slotProps={{
                    input: {
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />,
                    }
                  }}
                  sx={inputStyles}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Şifre"
                  type="password"
                  id="password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  slotProps={{
                    input: {
                      startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />,
                    }
                  }}
                  sx={inputStyles}
                />

                {mode === 'login' && (
                  <Box sx={{ textAlign: 'right', mt: 1 }}>
                    <Button 
                      size="small" 
                      onClick={() => setForgotPasswordStep(1)}
                      sx={{ textTransform: 'none', color: 'text.secondary', '&:hover': { color: '#00d4ff' } }}
                    >
                      Şifremi unuttum
                    </Button>
                  </Box>
                )}

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

                {panelMode === "expert" && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Sadece uzman hesaplarıyla giriş yapabilirsiniz. <br />
                    <strong>Demo:</strong> gold@portfol.io / expert123
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 20px rgba(0, 212, 255, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #33ddff 0%, #9655f5 100%)',
                      boxShadow: '0 6px 30px rgba(0, 212, 255, 0.35)',
                    },
                  }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : (mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
                </Button>
              </Box>

              {/* Demo Accounts */}
              <Box sx={{ mt: 3, p: 2, borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                  Demo Hesaplar
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="USER" size="small" sx={{ background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', fontWeight: 700, fontSize: '0.6rem', height: 20 }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                      mert@example.com / 123456
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="ADMIN" size="small" sx={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 700, fontSize: '0.6rem', height: 20 }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                      admin@portfol.io / admin123
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="EXPERT" size="small" sx={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontWeight: 700, fontSize: '0.6rem', height: 20 }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                      bronze@portfol.io / expert123
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </>
          ) : forgotPasswordStep === 1 ? (
            <Box component="form" onSubmit={handleRequestReset}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>Şifremi Unuttum</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, textAlign: 'center' }}>
                Kayıtlı e-posta adresinizi girin, size bir kurtarma kodu gönderelim.
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                label="E-posta Adresi"
                value={resetData.email}
                onChange={(e) => setResetData(prev => ({ ...prev, email: e.target.value }))}
                InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} /> }}
                  sx={inputStyles}
              />

              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 4, py: 1.5, fontWeight: 700, background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)' }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Kod Gönder'}
              </Button>
              
              <Button 
                fullWidth 
                onClick={() => setForgotPasswordStep(0)}
                sx={{ mt: 1, color: 'text.secondary', textTransform: 'none' }}
              >
                Geri Dön
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handlePerformReset}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>Şifre Belirleme</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, textAlign: 'center' }}>
                E-postanıza gönderilen kodu ve yeni şifrenizi girin.
              </Typography>

              {simulationCode && (
                <Box sx={{ p: 1, mb: 2, background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed #10b981', borderRadius: '8px', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                    SIMÜLASYON KODU: {simulationCode}
                  </Typography>
                </Box>
              )}
              
              <TextField
                margin="normal"
                required
                fullWidth
                label="Doğrulama Kodu"
                value={resetData.code}
                onChange={(e) => setResetData(prev => ({ ...prev, code: e.target.value }))}
                inputProps={{ style: { textAlign: 'center', letterSpacing: '0.3em', fontWeight: 700 } }}
                  sx={inputStyles}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Yeni Şifre"
                type="password"
                value={resetData.newPassword}
                onChange={(e) => setResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} /> }}
                  sx={inputStyles}
              />

              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 4, py: 1.5, fontWeight: 700, background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)' }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Şifreyi Güncelle'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
