import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { SnackbarProvider } from 'notistack';
import ErrorBoundary from './components/ErrorBoundary';
import './globals.css';

import { MarketProvider } from './contexts/MarketContext';
import { AppThemeProvider } from './contexts/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppThemeProvider>
        <SnackbarProvider maxSnack={3}>
          <MarketProvider>
            <App />
          </MarketProvider>
        </SnackbarProvider>
      </AppThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
