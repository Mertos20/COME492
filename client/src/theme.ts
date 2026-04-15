import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // Canlı bir yeşil tonu
    },
    secondary: {
      main: '#FFC107', // Canlı bir sarı/turuncu tonu
    },
    background: {
      default: '#f5f5f5', // Açık gri bir arka plan
      paper: '#ffffff',
    },
    text: {
        primary: '#333333',
        secondary: '#555555',
    }
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
        fontWeight: 600,
    },
    h5: {
        fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                textTransform: 'none',
            }
        }
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 12,
            }
        }
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                boxShadow: 'none',
                borderBottom: '1px solid #e0e0e0'
            }
        }
    }
  }
});

export default theme;
