import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { ReactNode, useState, useEffect } from "react";
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
  Menu,
  MenuItem,
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
  TrendingDown,
  Person,
  Assessment,
  Star,
  DarkMode,
  LightMode,
  Radar,
  CalendarToday,
  Public,
} from "@mui/icons-material";
import NotificationBell from "./NotificationBell";
import { useThemeMode } from "../contexts/ThemeContext";
import { useMarket } from "../contexts/MarketContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useTranslation } from "react-i18next";



const getPageInfo = (path: string, t: any) => {
  if (path === '/') return { title: t('nav.dashboard'), subtitle: t('nav.dashboard_sub') };
  if (path.startsWith('/markets')) return { title: t('nav.markets'), subtitle: t('nav.markets_sub') };
  if (path.startsWith('/trading')) return { title: t('nav.trading'), subtitle: t('nav.trading_sub') };
  if (path.startsWith('/portfolio')) return { title: t('nav.portfolio'), subtitle: t('nav.portfolio_sub') };
  if (path.startsWith('/watchlist')) return { title: t('nav.watchlist'), subtitle: t('nav.watchlist_sub') };
  if (path.startsWith('/transactions')) return { title: t('nav.transactions'), subtitle: t('nav.transactions_sub') };
  if (path.startsWith('/chat')) return { title: t('nav.chat'), subtitle: t('nav.chat_sub') };
  if (path.startsWith('/analysis')) return { title: t('nav.analysis'), subtitle: t('nav.analysis_sub') };
  if (path.startsWith('/game')) return { title: t('nav.game'), subtitle: t('nav.game_sub') };
  if (path.startsWith('/load-balance')) return { title: t('nav.load_balance'), subtitle: t('nav.load_balance_sub') };
  if (path.startsWith('/profile')) return { title: t('nav.profile'), subtitle: t('nav.profile_sub') };
  if (path.startsWith('/subscriptions')) return { title: t('nav.subscriptions'), subtitle: t('nav.subscriptions_sub') };
  if (path.startsWith('/admin')) return { title: t('nav.admin'), subtitle: t('nav.admin_sub') };
  if (path.startsWith('/expert')) return { title: t('nav.expert'), subtitle: t('nav.expert_sub') };
  if (path.startsWith('/news')) return { title: t('nav.news'), subtitle: t('nav.news_sub') };
  return { title: t('nav.default_title'), subtitle: t('nav.default_sub') };
};

const worldClocks = [
  { label: "New York", timeZone: "America/New_York" },
  { label: "Londra", timeZone: "Europe/London" },
  { label: "Tokyo", timeZone: "Asia/Tokyo" },
  { label: "Sidney", timeZone: "Australia/Sydney" },
  { label: "İstanbul", timeZone: "Europe/Istanbul" }
];

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
  const [collapsed, setCollapsed] = useState(false);
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';
  const { instruments } = useMarket();
  const [tickerIndex, setTickerIndex] = useState(0);
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, formatMoney } = useCurrency();
  const [currencyAnchorEl, setCurrencyAnchorEl] = useState<null | HTMLElement>(null);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('en') ? 'tr' : 'en');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tickerItems = instruments.filter(i => ["BTCUSDT", "ETHUSDT", "XAUUSD", "USDTRY"].includes(i.symbol));
  const displayItems = tickerItems.length > 0 ? tickerItems : instruments.slice(0, 4);
  const currentTicker = displayItems.length > 0 ? displayItems[tickerIndex % displayItems.length] : null;
  const pageInfo = getPageInfo(location.pathname, t);
  const currentClock = worldClocks[tickerIndex % worldClocks.length];
  const clockTime = new Intl.DateTimeFormat('tr-TR', { timeZone: currentClock.timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date());

  const baseLinks: NavItem[] = user?.isAdmin
    ? [
        { path: "/admin", label: t('nav.admin'), icon: <AdminPanelSettings />, adminOnly: true },
      ]
    : [
        { path: "/", label: t('nav.dashboard'), icon: <Dashboard /> },
        { path: "/markets", label: t('nav.markets'), icon: <ShowChart /> },
        { path: "/news", label: t('nav.news'), icon: <Article /> },
      ];

  const userLinks: NavItem[] =
    user?.role === "user" && !user.isAdmin
      ? [
          { path: "/watchlist", label: t('nav.watchlist'), icon: <Star /> },
          { path: "/load-balance", label: t('nav.load_balance'), icon: <AccountBalanceWallet /> },
          { path: "/transactions", label: t('nav.transactions'), icon: <Receipt /> },
          { path: "/trading", label: t('nav.trading'), icon: <SwapHoriz /> },
          { path: "/chat", label: t('nav.chat'), icon: <People /> },
          { path: "/analysis", label: t('nav.analysis'), icon: <Assessment /> },
          { path: "/game", label: t('nav.game'), icon: <Radar /> },
        ]
      : user?.role === "expert" ? [
          { path: "/expert", label: t('nav.expert'), icon: <AdminPanelSettings /> },
          { path: "/profile", label: t('nav.profile'), icon: <Person /> },
        ] : [];

  const allLinks = [...baseLinks, ...userLinks].filter(link => !link.adminOnly || (link.adminOnly && user?.isAdmin));

  const showSidebar = user !== null;
  const sidebarWidth = showSidebar ? (collapsed && !isMobile ? 88 : 260) : 0;

  const sidebarContent = (
    <Box
      sx={{
        width: isMobile ? 260 : sidebarWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isDark ? 'rgba(10, 14, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
        transition: 'width 0.3s ease',
        overflowX: 'hidden',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
        justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
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
        {(!collapsed || isMobile) && (
          <Box sx={{ whiteSpace: 'nowrap' }}>
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
              {t('nav.default_sub')}
            </Typography>
          </Box>
        )}
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ ml: 'auto', color: 'text.secondary' }}>
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, px: collapsed && !isMobile ? 1 : 1.5, py: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {(!collapsed || isMobile) && (
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
            {t('nav.main_menu')}
          </Typography>
        )}
        {allLinks.map((link) => {
          const isActive = location.pathname === link.path;
          const content = (
            <Box
              component={Link}
              to={link.path}
              onClick={() => { if (isMobile) setDrawerOpen(false); }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                px: collapsed && !isMobile ? 0 : 1.5,
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
              {(!collapsed || isMobile) && (
                <Typography variant="body2" sx={{ ml: 1.5, fontWeight: isActive ? 700 : 500, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {link.label}
                </Typography>
              )}
            </Box>
          );
          return collapsed && !isMobile ? (
            <Tooltip key={link.path} title={link.label} placement="right" arrow>
              {content}
            </Tooltip>
          ) : (
            <React.Fragment key={link.path}>{content}</React.Fragment>
          );
        })}

        {user?.role === "user" && !user.isAdmin && (
          <>
            {(!collapsed || isMobile) && (
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
                {t('nav.quick_actions')}
              </Typography>
            )}
            {[
              { path: '/subscriptions', label: t('nav.subscriptions'), icon: <WorkspacePremium sx={{ opacity: 0.7 }} />, color: '#7c3aed', bgHover: 'rgba(124, 58, 237, 0.08)' },
              { path: '/load-balance', label: t('nav.load_balance'), icon: <AddCard sx={{ opacity: 0.7 }} />, color: '#10b981', bgHover: 'rgba(16, 185, 129, 0.08)' },
              { path: '/profile', label: t('nav.profile'), icon: <Person sx={{ opacity: 0.7 }} />, color: '#00d4ff', bgHover: 'rgba(0, 212, 255, 0.08)' },
            ].map(link => {
              const isActive = location.pathname === link.path;
              const content = (
                <Box
                  component={Link}
                  to={link.path}
                  onClick={() => { if (isMobile) setDrawerOpen(false); }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                    px: collapsed && !isMobile ? 0 : 1.5,
                    py: 1.2,
                    mb: 0.3,
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: isActive ? link.color : '#94a3b8',
                    backgroundColor: isActive ? link.bgHover : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isActive ? link.bgHover : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? link.color : '#e2e8f0',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex' }}>{link.icon}</Box>
                  {(!collapsed || isMobile) && (
                    <Typography variant="body2" sx={{ ml: 1.5, fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {link.label}
                    </Typography>
                  )}
                </Box>
              );
              return collapsed && !isMobile ? (
                <Tooltip key={link.path} title={link.label} placement="right" arrow>
                  {content}
                </Tooltip>
              ) : (
                <React.Fragment key={link.path}>{content}</React.Fragment>
              );
            })}
          </>
        )}
      </Box>

      {/* User Info at Bottom */}
      {user && (
        <Box
          sx={{
            p: collapsed && !isMobile ? 1 : 2,
            mx: collapsed && !isMobile ? 1 : 1.5,
            mb: 1.5,
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: collapsed && !isMobile ? 'center' : 'stretch',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: collapsed && !isMobile ? 0 : 1.5 }}>
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
            {(!collapsed || isMobile) && (
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
            )}
          </Box>
          {user.role === "user" && !user.isAdmin && (!collapsed || isMobile) && (
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
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>{t('nav.balance')}</Typography>
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
          {(!collapsed || isMobile) ? (
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
              {t('nav.logout')}
            </Button>
          ) : (
            <Tooltip title={t('nav.logout')} placement="right" arrow>
              <IconButton
                onClick={onLogout}
                sx={{
                  mt: 1,
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  },
                }}
              >
                <Logout sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar - Desktop */}
      {!isMobile && showSidebar && (
        <Box
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 1200,
            transition: 'width 0.3s ease',
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && showSidebar && (
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
          ml: isMobile ? 0 : `${sidebarWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* Top Bar */}
        <Box
          sx={{
              height: 76,
            display: 'flex',
            alignItems: 'center',
              px: { xs: 2, md: 4 },
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
              background: isDark ? 'rgba(10, 14, 39, 0.8)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            position: 'sticky',
            top: 0,
            zIndex: 1100,
              boxShadow: isDark ? '0 4px 30px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          {!isMobile && showSidebar && (
            <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ mr: 2, color: 'text.secondary' }}>
              <MenuIcon />
            </IconButton>
          )}
          {isMobile && showSidebar && (
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
          {!isMobile && !showSidebar && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: '1.2rem',
                background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              portfol.io
            </Typography>
          )}
            
            {/* Center / Page Title Area */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', ml: { xs: 0, md: 4 } }}>
              {!isMobile && user && (
                <Box key={location.pathname} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, animation: 'fadeIn 0.3s ease-out' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
                    {pageInfo.title}
                  </Typography>
                  <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: isDark ? '#00d4ff' : '#7c3aed' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {pageInfo.subtitle}
                  </Typography>
                </Box>
              )}
            </Box>

          {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2.5 } }}>
                {!isMobile && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', p: '6px 12px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                      <Public sx={{ fontSize: 16, color: '#10b981' }} />
                      <Typography key={currentClock.label} variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em', animation: 'fadeIn 0.5s ease-in-out' }}>
                        {currentClock.label}: {clockTime}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1, color: 'text.secondary', p: '6px 12px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                      <CalendarToday sx={{ fontSize: 16, color: '#00d4ff' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                        {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, ml: user ? 2.5 : 'auto' }}>
              {!isMobile && currentTicker && (
                <Chip
                  icon={currentTicker.change30d >= 0 ? <TrendingUp sx={{ color: '#10b981 !important', fontSize: '1.2rem !important' }} /> : <TrendingDown sx={{ color: '#ef4444 !important', fontSize: '1.2rem !important' }} />}
                  label={
                    <Box key={currentTicker.symbol} sx={{ display: 'flex', alignItems: 'center', gap: 1, animation: 'fadeIn 0.5s ease-in-out' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.secondary' }}>
                        {currentTicker.symbol.replace('USDT', '').replace('USD', '')}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'monospace', color: currentTicker.change30d >= 0 ? '#10b981' : '#ef4444' }}>
                        {formatMoney(currentTicker.price)}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    height: 40,
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                    px: 1,
                    transition: 'all 0.3s ease',
                  }}
                />
              )}
          {user && (
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
          )}
          <Button
            onClick={toggleLanguage}
            sx={{
              minWidth: 40,
              p: '6px',
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: '0.8rem',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              '&:hover': {
                borderColor: '#00d4ff',
                color: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
              },
            }}
          >
            {i18n.language?.startsWith('en') ? 'EN' : 'TR'}
          </Button>

          {user && (
            <>
              <Button
                onClick={(e) => setCurrencyAnchorEl(e.currentTarget)}
                sx={{
                  minWidth: 40,
                  p: '6px',
                  color: 'text.secondary',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: '#7c3aed',
                    color: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.05)',
                  },
                }}
              >
                {currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€"} {currency}
              </Button>
              <Menu
                anchorEl={currencyAnchorEl}
                open={Boolean(currencyAnchorEl)}
                onClose={() => setCurrencyAnchorEl(null)}
                PaperProps={{
                  sx: {
                    mt: 1,
                    background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                <MenuItem onClick={() => { setCurrency("TRY"); setCurrencyAnchorEl(null); }}>₺ TRY</MenuItem>
                <MenuItem onClick={() => { setCurrency("USD"); setCurrencyAnchorEl(null); }}>$ USD</MenuItem>
                <MenuItem onClick={() => { setCurrency("EUR"); setCurrencyAnchorEl(null); }}>€ EUR</MenuItem>
              </Menu>
            </>
          )}
              {user && <NotificationBell />}
              {!isMobile && user && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 2, borderLeft: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                        {t('nav.welcome')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.85rem', lineHeight: 1 }}>
                        {user.fullName}
                      </Typography>
                    </Box>
                  <Avatar
                    sx={{
                        width: 40,
                        height: 40,
                        fontSize: '1rem',
                        fontWeight: 800,
                        border: `2px solid ${tierColors[user.membership] || '#94a3b8'}`,
                      background: `linear-gradient(135deg, ${tierColors[user.membership] || '#94a3b8'}, #7c3aed)`,
                    }}
                  >
                    {user.fullName.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
              )}
          </Box>
        </Box>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: user ? { xs: 2, sm: 3, md: 4 } : 0,
            maxWidth: '100%',
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
