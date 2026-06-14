import { useEffect, useState } from "react";
import { api } from "../api";
import type { TransactionItem } from "../types";
import { FilterList, History } from "@mui/icons-material";
import EmptyState from "../components/EmptyState";
import { useTranslation } from "react-i18next";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  return new Date(value).toLocaleString("tr-TR");
};

const typeConfig: Record<string, { color: string; bg: string; border: string }> = {
  buy: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  sell: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  deposit: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  upgrade: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
};

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "all", symbol: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { t } = useTranslation();

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type !== "all") params.set("type", filters.type);
      if (filters.symbol.trim()) params.set("symbol", filters.symbol.trim().toUpperCase());
      if (filters.from) params.set("from", new Date(filters.from).toISOString());
      if (filters.to) params.set("to", new Date(filters.to).toISOString());
      params.set("page", page.toString());
      params.set("limit", "20");
      const query = params.toString();
      const response = await api.get<{transactions: TransactionItem[], pagination: {totalPages: number}}>(`/transactions/history${query ? `?${query}` : ""}`);
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pagination.totalPages);
    } catch { console.error(t('transactions.error_fetch')); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTransactions(); }, [page]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset page on filter change
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <History sx={{ color: '#00d4ff', fontSize: 28 }} />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>{t('transactions.title')}</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>{t('transactions.subtitle')}</Typography>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('transactions.filters')}</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('transactions.type_label')}</InputLabel>
              <Select size="small" value={filters.type} label={t('transactions.type_label')} onChange={(e) => handleFilterChange("type", e.target.value as string)}>
                <MenuItem value="all">{t('transactions.type_all')}</MenuItem>
                <MenuItem value="deposit">{t('transactions.type_deposit')}</MenuItem>
                <MenuItem value="buy">{t('transactions.type_buy')}</MenuItem>
                <MenuItem value="sell">{t('transactions.type_sell')}</MenuItem>
                <MenuItem value="upgrade">{t('transactions.type_upgrade')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label={t('transactions.symbol_placeholder')} value={filters.symbol} onChange={(e) => handleFilterChange("symbol", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              type="date"
              size="small"
              label={t('transactions.start_date')}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { style: { fontFamily: 'inherit', color: 'inherit' } }
              }}
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              type="date"
              size="small"
              label={t('transactions.end_date')}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { style: { fontFamily: 'inherit', color: 'inherit' } }
              }}
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={2}>
            <Button fullWidth variant="contained" onClick={loadTransactions} disabled={loading}
              sx={{ height: '40px', background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)', '&:hover': { background: 'linear-gradient(135deg, #33ddff 0%, #9655f5 100%)' } }}>
              {loading ? <CircularProgress size={20} /> : t('transactions.btn_filter')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : !loading && transactions.length === 0 ? (
        <EmptyState 
          title={t('transactions.empty_title')} 
          description={t('transactions.empty_desc')}
          icon="search"
        />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.06)' }
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('transactions.table_date')}</TableCell><TableCell>{t('transactions.table_type')}</TableCell><TableCell>{t('transactions.table_symbol')}</TableCell>
                <TableCell align="right">{t('transactions.table_amount')}</TableCell><TableCell align="right">{t('transactions.table_price')}</TableCell><TableCell align="right">{t('transactions.table_total')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => {
                const tc = typeConfig[tx.type] || typeConfig.deposit;
                return (
                  <TableRow key={tx._id}>
                    <TableCell><Typography variant="caption" sx={{ color: 'text.secondary' }}>{formatDateTime(tx.createdAt)}</Typography></TableCell>
                    <TableCell>
                      <Chip label={tx.type.toUpperCase()} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700, height: 22, backgroundColor: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }} />
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: '#00d4ff' }}>{tx.symbol || '-'}</Typography></TableCell>
                    <TableCell align="right">{tx.quantity || '-'}</TableCell>
                    <TableCell align="right">{tx.price ? formatMoney(tx.price) : '-'}</TableCell>
                    <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatMoney(tx.total)}</Typography></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(_, val) => setPage(val)} 
            color="primary" 
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'text.secondary',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(124,58,237,0.2) 100%)',
                  color: '#00d4ff',
                  fontWeight: 700,
                  border: '1px solid rgba(0,212,255,0.3)'
                }
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
}
