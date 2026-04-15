import { useState, FormEvent } from "react";
import type { AuthUser } from "../types";
import { api, setApiToken } from "../api";
import { Container, Paper, Typography, Box, Tabs, Tab, TextField, Button, Alert, CircularProgress, ToggleButtonGroup, ToggleButton } from "@mui/material";

interface LoginRegisterPageProps {
  onAuthSuccess: (token: string, user: AuthUser, balance: number) => void;
}

export default function LoginRegisterPage({ onAuthSuccess }: LoginRegisterPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [panelMode, setPanelMode] = useState<"user" | "expert">("user");
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const plans = ["free", "bronze", "silver", "gold"] as const;

  const normalizeUser = (raw: Partial<AuthUser>): AuthUser => ({
    id: raw.id || "",
    fullName: raw.fullName || "Kullanici",
    role: raw.role === "expert" ? "expert" : "user",
    membership: raw.membership && plans.includes(raw.membership) ? raw.membership : "free"
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

  return (
    <Container component="main" maxWidth="sm">
        <Paper elevation={6} sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    portfol.io
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Modern MERN Trading Platformu
                </Typography>
            </Box>

            <ToggleButtonGroup
                color="primary"
                value={panelMode}
                exclusive
                onChange={handlePanelModeChange}
                aria-label="Panel Modu"
                fullWidth
                sx={{ mb: 3 }}
            >
                <ToggleButton value="user">Kullanıcı Paneli</ToggleButton>
                <ToggleButton value="expert">Uzman Paneli</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={mode} onChange={(e, newValue) => setMode(newValue)} centered>
                    <Tab label="Giriş Yap" value="login" />
                    {panelMode === 'user' && <Tab label="Kayıt Ol" value="register" />}
                </Tabs>
            </Box>

            <Box component="form" onSubmit={handleAuth} sx={{ mt: 3 }}>
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
                />
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
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
                    sx={{ mt: 3, mb: 2, py: 1.5 }}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : (mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
                </Button>
            </Box>
            
            <Paper variant="outlined" sx={{ p: 2, mt: 4, backgroundColor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>Demo Hesaplar</Typography>
                <Typography variant="body2"><strong>Kullanıcı:</strong> mert@example.com / 123456</Typography>
                <Typography variant="body2"><strong>Uzman (Bronze):</strong> bronze@portfol.io / expert123</Typography>
            </Paper>
        </Paper>
    </Container>
  );
}
