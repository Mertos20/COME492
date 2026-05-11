import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { SnackbarProvider } from 'notistack';
import ErrorBoundary from './components/ErrorBoundary';
import './globals.css';

import { MarketProvider } from './contexts/MarketContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <MarketProvider>
            <App />
          </MarketProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
