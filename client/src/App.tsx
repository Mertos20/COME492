import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

const plans = ["free", "bronze", "silver", "gold"] as const;

const normalizeUser = (raw: Partial<AuthUser>): AuthUser => ({
  id: raw.id || "",
  fullName: raw.fullName || "Kullanici",
  role: raw.role === "expert" ? "expert" : "user",
  membership: raw.membership && plans.includes(raw.membership) ? raw.membership : "free"
});

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [popular, setPopular] = useState<MarketInstrument[]>([]);
  const [markets, setMarkets] = useState<MarketInstrument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setApiToken(token);
  }, [token]);

  useEffect(() => {
    const loadInitial = async () => {
      // Load markets
      try {
        const [popularRes, allRes] = await Promise.all([
          api.get<MarketInstrument[]>("/markets/popular"),
          api.get<MarketInstrument[]>("/markets/all")
        ]);
        setPopular(popularRes.data);
        setMarkets(allRes.data);
      } catch {
        console.error("Market data failed");
      }

      // Load user if token exists
      if (token) {
        try {
          const me = await api.get<{ user: AuthUser; balance: number }>("/auth/me");
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

  const handleUpgrade = (newMembership: AuthUser["membership"]) => {
    if (user) {
      setUser({ ...user, membership: newMembership });
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

  if (loading) {
    return (
      <div className="layout">
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p>Yukleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {!token ? (
        <LoginRegisterPage onAuthSuccess={handleAuthSuccess} />
      ) : (
        <Layout user={user} balance={balance} onLogout={handleLogout} activePage={window.location.pathname}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/markets" element={<MarketsPage markets={markets} popular={popular} />} />
            <Route path="/subscriptions" element={<SubscriptionPage user={user} balance={balance} onUpgrade={handleUpgrade} />} />
            <Route
              path="/deposit"
              element={user?.role === "user" ? <TradingPage balance={balance} onTradeComplete={handleTradeComplete} /> : <Navigate to="/" />}
            />
            <Route
              path="/trading"
              element={user?.role === "user" ? <TradingPage balance={balance} onTradeComplete={handleTradeComplete} /> : <Navigate to="/" />}
            />
            <Route
              path="/portfolio"
              element={user?.role === "user" ? <PortfolioPage /> : <Navigate to="/" />}
            />
            <Route
              path="/transactions"
              element={user?.role === "user" ? <TransactionHistoryPage /> : <Navigate to="/" />}
            />
            <Route
              path="/chat"
              element={user?.role === "user" ? <ChatPage user={user} token={token} /> : <Navigate to="/" />}
            />
            <Route
              path="/expert"
              element={user?.role === "expert" ? <ExpertPanelPage user={user} token={token} /> : <Navigate to="/" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

export default App;


