import { createTheme, alpha } from '@mui/material/styles';

type ThemeMode = 'light' | 'dark';

const getTheme = (mode: ThemeMode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#00d4ff',
        light: '#33ddff',
        dark: '#00a8cc',
        contrastText: isDark ? '#0a0e27' : '#ffffff',
      },
      secondary: {
        main: '#7c3aed',
        light: '#9655f5',
        dark: '#6025c9',
        contrastText: '#ffffff',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
      },
      background: {
        default: isDark ? '#0a0e27' : '#f5f7fb',
        paper: isDark ? '#111638' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e2e8f0' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      action: {
        hover: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
        selected: isDark ? 'rgba(0, 212, 255, 0.08)' : 'rgba(0, 212, 255, 0.08)',
        disabled: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.26)',
        disabledBackground: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      },
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      h1: { fontWeight: 800, letterSpacing: '-0.025em' },
      h2: { fontWeight: 700, letterSpacing: '-0.025em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.015em' },
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isDark
              ? 'radial-gradient(ellipse at 20% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(124, 58, 237, 0.03) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at 20% 50%, rgba(0, 212, 255, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(124, 58, 237, 0.04) 0%, transparent 50%)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none' as const,
            fontWeight: 600,
            padding: '8px 20px',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
            },
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #33ddff 0%, #00b8e6 100%)',
            },
          },
          containedSecondary: {
            background: 'linear-gradient(135deg, #7c3aed 0%, #6025c9 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #9655f5 0%, #7c3aed 100%)',
            },
          },
          outlined: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
            '&:hover': {
              borderColor: 'rgba(0, 212, 255, 0.5)',
              background: 'rgba(0, 212, 255, 0.05)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: 16,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          elevation1: { boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.06)' },
          elevation2: { boxShadow: isDark ? '0 6px 24px rgba(0, 0, 0, 0.25)' : '0 6px 24px rgba(0, 0, 0, 0.08)' },
          elevation3: { boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)' },
          elevation6: { boxShadow: isDark ? '0 12px 48px rgba(0, 0, 0, 0.4)' : '0 12px 48px rgba(0, 0, 0, 0.12)' },
          elevation8: { boxShadow: isDark ? '0 16px 56px rgba(0, 0, 0, 0.45)' : '0 16px 56px rgba(0, 0, 0, 0.14)' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: 16,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: isDark ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 212, 255, 0.3)',
              transform: 'translateY(-3px)',
              boxShadow: isDark
                ? '0 12px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 212, 255, 0.1)'
                : '0 12px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 212, 255, 0.15)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(10, 14, 39, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              transition: 'all 0.25s ease',
              '& fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)',
                transition: 'all 0.25s ease',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 212, 255, 0.3)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00d4ff',
                boxShadow: '0 0 0 3px rgba(0, 212, 255, 0.1)',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '0.75rem',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none' as const,
            fontWeight: 600,
            fontSize: '0.875rem',
            color: isDark ? '#94a3b8' : '#64748b',
            '&.Mui-selected': {
              color: '#00d4ff',
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: isDark ? 'rgba(0, 212, 255, 0.05)' : 'rgba(0, 212, 255, 0.04)',
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(0, 0, 0, 0.04)',
            padding: '14px 16px',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#111638' : '#ffffff',
            backgroundImage: 'none',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 20,
            boxShadow: isDark ? '0 25px 80px rgba(0, 0, 0, 0.6)' : '0 25px 80px rgba(0, 0, 0, 0.15)',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: '1px solid',
          },
          standardError: {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.2)',
            color: isDark ? '#f87171' : '#dc2626',
          },
          standardSuccess: {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
            borderColor: 'rgba(16, 185, 129, 0.2)',
            color: isDark ? '#34d399' : '#059669',
          },
          standardWarning: {
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
            borderColor: 'rgba(245, 158, 11, 0.2)',
            color: isDark ? '#fbbf24' : '#d97706',
          },
          standardInfo: {
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
            borderColor: 'rgba(59, 130, 246, 0.2)',
            color: isDark ? '#60a5fa' : '#2563eb',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            color: isDark ? '#94a3b8' : '#64748b',
            textTransform: 'none' as const,
            fontWeight: 600,
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 212, 255, 0.15)',
              color: '#00d4ff',
              borderColor: 'rgba(0, 212, 255, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(0, 212, 255, 0.2)',
              },
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
            fontWeight: 700,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(0, 212, 255, 0.15)',
              },
            },
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: '#00d4ff',
          },
        },
      },
    },
  });
};

export default getTheme;
