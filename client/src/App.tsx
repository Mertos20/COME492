import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { api, setApiToken } from "./api";
import type { AuthUser, MarketInstrument } from "./types";

import Layout from "./components/Layout";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import DashboardPage from "./pages/DashboardPage";
import MarketsPage from "./pages/MarketsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import TradingPage from "./pages/TradingPage";
import PortfolioPage from "./pages/PortfolioPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";
import ChatPage from "./pages/ChatPage";
import ExpertPanelPage from "./pages/ExpertPanelPage";
import BalanceLoadPage from "./pages/BalanceLoadPage";
import NewsPage from "./pages/NewsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import AnalysisPage from "./pages/AnalysisPage";
import WatchlistPage from "./pages/WatchlistPage";
import NotFoundPage from "./pages/NotFoundPage";
import GamePage from "./pages/GamePage";

const plans = ["free", "bronze", "silver", "gold"] as const;

const normalizeUser = (raw: Partial<AuthUser & { email?: string; isAdmin?: boolean }>): AuthUser => ({
  id: raw.id || "",
  fullName: raw.fullName || "Kullanici",
  email: raw.email || "",
  role: raw.role === "expert" ? "expert" : "user",
  membership: raw.membership && plans.includes(raw.membership) ? raw.membership : "free",
  isAdmin: raw.isAdmin || false,
});

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      enqueueSnackbar("İnternet bağlantısı sağlandı.", { variant: "success" });
    };
    const handleOffline = () => {
      setIsOffline(true);
      enqueueSnackbar("İnternet bağlantısı koptu. Uygulama çevrimdışı modda çalışıyor.", { 
        variant: "error",
        autoHideDuration: null 
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [enqueueSnackbar]);

  useEffect(() => {
    setApiToken(token);
  }, [token]);

  useEffect(() => {
    const loadInitial = async () => {


      // Load user if token exists
      if (token) {
        try {
          const me = await api.get<{ user: AuthUser; balance: number; isAdmin: boolean }>("/auth/me");
          const safeUser = normalizeUser(me.data.user);
          setUser(safeUser);
          setBalance(me.data.balance);
        } catch {
          localStorage.removeItem("token");
          setToken(null);
        }
      }

      setLoading(false);
    };

    loadInitial();
  }, [token]);

  const handleAuthSuccess = (newToken: string, newUser: AuthUser, newBalance: number) => {
    setToken(newToken);
    setUser(newUser);
    setBalance(newBalance);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setBalance(0);
  };

  const handleUpgrade = async (newMembership: AuthUser["membership"]) => {
    if (user) {
      setUser({ ...user, membership: newMembership });
    }
    // Refresh balance from server after membership purchase
    if (token) {
      try {
        const res = await api.get<{ user: AuthUser; balance: number }>("/auth/me");
        setBalance(res.data.balance);
      } catch {
        console.error("Failed to refresh balance after upgrade");
      }
    }
  };

  const handleTradeComplete = async () => {
    if (token) {
      try {
        const res = await api.get<{ user: AuthUser; balance: number }>("/auth/me");
        setBalance(res.data.balance);
      } catch {
        console.error("Failed to refresh balance");
      }
    }
  };

  const handleProfileUpdate = (updatedUser: AuthUser, newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(normalizeUser(updatedUser));
  };

  const handleMembershipCancel = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    if (user) setUser({ ...user, membership: "free" });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0e27',
        gap: '24px',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
          boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
        }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>P</span>
        </div>
        <p style={{
          color: '#94a3b8',
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.875rem',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Yükleniyor...
        </p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/404" element={<NotFoundPage />} />
        {!token ? (
          <Route path="/*" element={
            <Layout user={null} balance={0} onLogout={() => {}}>
              <Routes>
                <Route path="/" element={<LoginRegisterPage onAuthSuccess={handleAuthSuccess} />} />
                {/* Giriş yapılmadığında bilinen sayfalara erişilirse Ana Sayfaya (Login) yönlendir */}
                {[
                  "/markets", "/news", "/subscriptions", "/deposit", "/trading",
                  "/portfolio", "/watchlist", "/transactions", "/admin", "/chat",
                  "/analysis", "/expert", "/load-balance", "/profile", "/game"
                ].map((p) => (
                  <Route key={p} path={p} element={<Navigate to="/" replace />} />
                ))}
                {/* Bilinmeyen tüm URL'lerde 404'ü göster */}
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Layout>
          } />
        ) : (
          <Route path="/*" element={
            <Layout user={user} balance={balance} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={user?.isAdmin ? <Navigate to="/admin" /> : <DashboardPage />} />
                <Route path="/markets" element={user?.isAdmin ? <Navigate to="/admin" /> : <MarketsPage />} />
                <Route path="/news" element={user?.isAdmin ? <Navigate to="/admin" /> : <NewsPage />} />
                <Route path="/subscriptions" element={user?.isAdmin ? <Navigate to="/admin" /> : <SubscriptionPage user={user} balance={balance} onUpgrade={handleUpgrade} onBalanceChange={setBalance} />} />
                <Route
                  path="/deposit"
                  element={user?.role === "user" && !user.isAdmin ? <BalanceLoadPage onBalanceChange={handleTradeComplete} /> : <Navigate to="/" />}
                />
                <Route
                  path="/trading"
                  element={user?.role === "user" && !user.isAdmin ? <TradingPage balance={balance} onTradeComplete={handleTradeComplete} /> : <Navigate to="/" />}
                />
                <Route
                  path="/portfolio"
                  element={user?.role === "user" && !user.isAdmin ? <PortfolioPage /> : <Navigate to="/" />}
                />
                <Route
                  path="/watchlist"
                  element={user?.role === "user" && !user.isAdmin ? <WatchlistPage /> : <Navigate to="/" />}
                />
                <Route
                  path="/transactions"
                  element={user?.role === "user" && !user.isAdmin ? <TransactionHistoryPage /> : <Navigate to="/" />}
                />
                <Route
                  path="/admin"
                  element={user?.isAdmin ? <AdminPage /> : <Navigate to="/" />}
                />
                <Route
                  path="/chat"
                  element={user?.role === "user" && !user.isAdmin ? <ChatPage user={user} token={token} /> : <Navigate to="/" />}
                />
                <Route
                  path="/analysis"
                  element={user?.role === "user" && !user.isAdmin ? <AnalysisPage /> : <Navigate to="/" />}
                />
                <Route
                  path="/expert"
                  element={user?.role === "expert" ? <ExpertPanelPage user={user} token={token} /> : <Navigate to="/" />}
                />
                <Route path="/load-balance" element={user?.role === "user" && !user.isAdmin ? <BalanceLoadPage onBalanceChange={handleTradeComplete} /> : <Navigate to="/" />} />
                <Route
                  path="/profile"
                  element={user?.isAdmin ? <Navigate to="/admin" /> : <ProfilePage user={user} onProfileUpdate={handleProfileUpdate} onMembershipCancel={handleMembershipCancel} />}
                />
                <Route
                  path="/game"
                  element={user?.role === "user" && !user.isAdmin ? <GamePage /> : <Navigate to="/" />}
                />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Layout>
          } />
        )}
      </Routes>
    </Router>
  );
}

export default App;
