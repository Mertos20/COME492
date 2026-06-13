import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { ReactNode, useState } from "react";
import type { AuthUser } from "../types";
import {
  Box,
  Button,
  Typography,
  Avatar,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  Dashboard,
  ShowChart,
  Article,
  AccountBalanceWallet,
  Receipt,
  SwapHoriz,
  People,
  WorkspacePremium,
  Logout,
  Menu as MenuIcon,
  Close,
  AddCard,
  AdminPanelSettings,
  TrendingUp,
  Person,
  Assessment,
  Star,
  DarkMode,
  LightMode,
} from "@mui/icons-material";
import NotificationBell from "./NotificationBell";
import { useThemeMode } from "../contexts/ThemeContext";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    value
  );

interface LayoutProps {
  user: AuthUser | null;
  balance: number;
  onLogout: () => void;
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const tierColors: Record<string, string> = {
  free: '#94a3b8',
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
};

export default function Layout({ user, balance, onLogout, children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';

  const baseLinks: NavItem[] = user?.isAdmin
    ? [
        { path: "/admin", label: "Admin", icon: <AdminPanelSettings />, adminOnly: true },
      ]
    : [
        { path: "/", label: "Dashboard", icon: <Dashboard /> },
        { path: "/markets", label: "Piyasalar", icon: <ShowChart /> },
        { path: "/news", label: "Haberler", icon: <Article /> },
      ];

  const userLinks: NavItem[] =
    user?.role === "user" && !user.isAdmin
      ? [
          { path: "/watchlist", label: "Favoriler", icon: <Star /> },
          { path: "/load-balance", label: "Cüzdan Yönetimi", icon: <AccountBalanceWallet /> },
          { path: "/transactions", label: "İşlem Geçmişi", icon: <Receipt /> },
          { path: "/trading", label: "Al/Sat", icon: <SwapHoriz /> },
          { path: "/chat", label: "Danışmanlar", icon: <People /> },
          { path: "/analysis", label: "Analiz & Raporlar", icon: <Assessment /> },
        ]
      : user?.role === "expert" ? [
          { path: "/expert", label: "Uzman Paneli", icon: <AdminPanelSettings /> },
          { path: "/profile", label: "Profil", icon: <Person /> },
        ] : [];

  const allLinks = [...baseLinks, ...userLinks].filter(link => !link.adminOnly || (link.adminOnly && user?.isAdmin));

  const sidebarContent = (
    <Box
      sx={{
        width: 260,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isDark ? 'rgba(10, 14, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
        }}
        onClick={() => { navigate('/'); if (isMobile) setDrawerOpen(false); }}
      >
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
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: '1.2rem',
              background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}
          >
            portfol.io
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
            YATIRIM PLATFORMU
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ ml: 'auto', color: 'text.secondary' }}>
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 1.5, py: 1, overflowY: 'auto' }}>
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Ana Menü
        </Typography>
        {allLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Box
              key={link.path}
              component={Link}
              to={link.path}
              onClick={() => { if (isMobile) setDrawerOpen(false); }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.2,
                mb: 0.3,
                borderRadius: '10px',
                textDecoration: 'none',
                color: isActive ? '#00d4ff' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  backgroundColor: isActive ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#00d4ff' : '#e2e8f0',
                },
                '&::before': isActive ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: '60%',
                  borderRadius: '0 4px 4px 0',
                  background: 'linear-gradient(180deg, #00d4ff, #7c3aed)',
                } : {},
              }}
            >
              <Box sx={{ display: 'flex', opacity: isActive ? 1 : 0.7, fontSize: '1.25rem' }}>{link.icon}</Box>
              <Typography variant="body2" sx={{ fontWeight: isActive ? 700 : 500, fontSize: '0.85rem' }}>
                {link.label}
              </Typography>
            </Box>
          );
        })}

        {user?.role === "user" && !user.isAdmin && (
          <>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 1,
                mt: 2,
                display: 'block',
                color: 'text.secondary',
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Hızlı İşlemler
            </Typography>
            <Box
              component={Link}
              to="/subscriptions"
              onClick={() => { if (isMobile) setDrawerOpen(false); }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.2,
                mb: 0.3,
                borderRadius: '10px',
                textDecoration: 'none',
                color: location.pathname === '/subscriptions' ? '#7c3aed' : '#94a3b8',
                backgroundColor: location.pathname === '/subscriptions' ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(124, 58, 237, 0.08)',
                  color: '#9655f5',
                },
              }}
            >
              <WorkspacePremium sx={{ opacity: 0.7 }} />
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>Üyelikler</Typography>
            </Box>
            <Box
              component={Link}
              to="/load-balance"
              onClick={() => { if (isMobile) setDrawerOpen(false); }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.2,
                mb: 0.3,
                borderRadius: '10px',
                textDecoration: 'none',
                color: location.pathname === '/load-balance' ? '#10b981' : '#94a3b8',
                backgroundColor: location.pathname === '/load-balance' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  color: '#34d399',
                },
              }}
            >
              <AddCard sx={{ opacity: 0.7 }} />
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>Bakiye Yükle</Typography>
            </Box>
            <Box
              component={Link}
              to="/profile"
              onClick={() => { if (isMobile) setDrawerOpen(false); }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.2,
                mb: 0.3,
                borderRadius: '10px',
                textDecoration: 'none',
                color: location.pathname === '/profile' ? '#00d4ff' : '#94a3b8',
                backgroundColor: location.pathname === '/profile' ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 212, 255, 0.08)',
                  color: '#33ddff',
                },
              }}
            >
              <Person sx={{ opacity: 0.7 }} />
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>Profil</Typography>
            </Box>
          </>
        )}
      </Box>

      {/* User Info at Bottom */}
      {user && (
        <Box
          sx={{
            p: 2,
            mx: 1.5,
            mb: 1.5,
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                fontSize: '0.875rem',
                background: `linear-gradient(135deg, ${tierColors[user.membership] || '#94a3b8'}, ${tierColors[user.membership] === '#ffd700' ? '#ff8c00' : '#7c3aed'})`,
              }}
            >
              {user.fullName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.fullName}
              </Typography>
              <Chip
                label={(user.membership || "free").toUpperCase()}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  backgroundColor: `${tierColors[user.membership]}20`,
                  color: tierColors[user.membership],
                  border: `1px solid ${tierColors[user.membership]}40`,
                }}
              />
            </Box>
          </Box>
          {user.role === "user" && !user.isAdmin && (
            <Box
              sx={{
                p: 1,
                borderRadius: '8px',
                background: 'rgba(0, 212, 255, 0.05)',
                border: '1px solid rgba(0, 212, 255, 0.1)',
                textAlign: 'center',
                mb: 1.5,
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>BAKİYE</Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #00d4ff, #10b981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {formatMoney(balance)}
              </Typography>
            </Box>
          )}
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<Logout sx={{ fontSize: '1rem !important' }} />}
            onClick={onLogout}
            sx={{
              fontSize: '0.75rem',
              py: 0.7,
              color: '#94a3b8',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
              },
            }}
          >
            Çıkış Yap
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 1200,
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: 'transparent',
              borderRight: 'none',
              boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          ml: isMobile ? 0 : '260px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Top Bar */}
        <Box
          sx={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            px: 3,
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
            background: isDark ? 'rgba(10, 14, 39, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            position: 'sticky',
            top: 0,
            zIndex: 1100,
          }}
        >
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: 1.5, color: 'text.secondary' }}>
              <MenuIcon />
            </IconButton>
          )}
          {isMobile && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              portfol.io
            </Typography>
          )}
          <Box sx={{ flex: 1 }} />
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Tooltip title={isDark ? 'Açık Tema' : 'Koyu Tema'}>
                <IconButton
                  onClick={toggleTheme}
                  size="small"
                  sx={{
                    color: isDark ? '#f59e0b' : '#6366f1',
                    background: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                    border: isDark ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid rgba(99, 102, 241, 0.15)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      transform: 'rotate(30deg)',
                    },
                  }}
                >
                  {isDark ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
                </IconButton>
              </Tooltip>
              {user.role === "user" && !user.isAdmin && !isMobile && (
                <Chip
                  icon={<AccountBalanceWallet sx={{ fontSize: '1rem !important' }} />}
                  label={formatMoney(balance)}
                  sx={{
                    background: 'rgba(0, 212, 255, 0.08)',
                    border: '1px solid rgba(0, 212, 255, 0.15)',
                    color: '#00d4ff',
                    fontWeight: 700,
                    '& .MuiChip-icon': { color: '#00d4ff' },
                  }}
                />
              )}
              <NotificationBell />
              {!isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.8rem',
                      background: `linear-gradient(135deg, ${tierColors[user.membership] || '#94a3b8'}, #7c3aed)`,
                    }}
                  >
                    {user.fullName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.85rem' }}>
                    {user.fullName}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            maxWidth: 1400,
            width: '100%',
            mx: 'auto',
            animation: 'fadeIn 0.4s ease-out',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
