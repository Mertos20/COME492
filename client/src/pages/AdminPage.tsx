import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { IUser } from '../types';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  People,
  AccountBalanceWallet,
  SupervisorAccount,
  Receipt,
  Search,
  Edit,
  Delete,
  AdminPanelSettings,
  FilterAlt,
  Close,
  AttachMoney,
  Person
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useSnackbar } from 'notistack';

interface AdminStats {
  totalUsers: number;
  totalBalance: number;
  expertCount: number;
  membershipDistribution: {
    free: number;
    bronze: number;
    silver: number;
    gold: number;
  };
  totalTransactions: number;
  totalVolume: number;
  recentTransactions: Array<{
    _id: string;
    userId: {
      _id: string;
      fullName: string;
      email: string;
      username: string;
    } | null;
    symbol: string;
    type: "buy" | "sell" | "deposit" | "upgrade";
    quantity: number;
    price: number;
    total: number;
    createdAt: string;
  }>;
}

const MEMBERSHIP_COLORS: Record<string, string> = {
  free: '#94a3b8',
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("tr-TR", { style: 'currency', currency: 'TRY' }).format(value);

export default function AdminPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    balance: 0,
    role: 'user',
    membership: 'free',
    expertTier: 'bronze'
  });

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get<IUser[]>('/admin/users'),
        api.get<AdminStats>('/admin/stats')
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Sistem bilgileri yüklenirken bir hata oluştu.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (user: IUser) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName || '',
      username: user.username || '',
      balance: user.balance || 0,
      role: user.role || 'user',
      membership: user.membership || 'free',
      expertTier: user.expertTier || 'bronze'
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.put<IUser>(`/admin/users/${selectedUser._id}`, editForm);
      enqueueSnackbar('Kullanıcı başarıyla güncellendi.', { variant: 'success' });
      setEditOpen(false);
      
      // Update local state
      setUsers(users.map(u => u._id === selectedUser._id ? res.data : u));
      // Refresh stats in background
      api.get<AdminStats>('/admin/stats').then(statsRes => setStats(statsRes.data));
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Kullanıcı güncellenirken hata oluştu.', { variant: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Bu kullanıcıyı sistemden silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        enqueueSnackbar('Kullanıcı silindi.', { variant: 'success' });
        setUsers(users.filter(u => u._id !== userId));
        // Refresh stats
        api.get<AdminStats>('/admin/stats').then(statsRes => setStats(statsRes.data));
      } catch (err) {
        console.error(err);
        enqueueSnackbar('Kullanıcı silinirken hata oluştu.', { variant: 'error' });
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography variant="h5" sx={{ color: 'text.secondary' }}>Admin verileri yükleniyor...</Typography>
      </Box>
    );
  }

  // Filtered users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesMembership = membershipFilter === 'all' || user.membership === membershipFilter;

    return matchesSearch && matchesRole && matchesMembership;
  });

  // Prepare chart data for user balances
  const balanceChartData = users
    .slice(0, 15)
    .map(u => ({
      name: u.username || u.fullName.split(' ')[0],
      Bakiye: u.balance
    }));

  // Prepare pie chart data
  const pieData = stats
    ? Object.entries(stats.membershipDistribution).map(([tier, count]) => ({
        name: tier.toUpperCase(),
        value: count,
        color: MEMBERSHIP_COLORS[tier] || '#ffffff'
      }))
    : [];

  return (
    <Grid container spacing={3} className="animate-fadeIn">
      {/* HEADER SECTION */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AdminPanelSettings sx={{ fontSize: 35, color: '#00d4ff' }} />
              Admin Kontrol Paneli
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Sistem-geneli varlık durumunu, aktif üyeleri izleyin ve kullanıcı hesaplarını modere edin.
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* STAT CARDS */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{
            p: 3,
            textAlign: 'center',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(0, 212, 255, 0.03) 100%)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: '16px'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '12px', background: 'rgba(0, 212, 255, 0.15)', display: 'flex' }}>
              <People sx={{ color: '#00d4ff', fontSize: 28 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Toplam Kayıtlı Kullanıcı
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
            {stats?.totalUsers}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{
            p: 3,
            textAlign: 'center',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex' }}>
              <AccountBalanceWallet sx={{ color: '#10b981', fontSize: 28 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Toplam Sistem Bakiyesi
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
            {formatMoney(stats?.totalBalance || 0)}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{
            p: 3,
            textAlign: 'center',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(124, 58, 237, 0.03) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            borderRadius: '16px'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '12px', background: 'rgba(124, 58, 237, 0.15)', display: 'flex' }}>
              <SupervisorAccount sx={{ color: '#7c3aed', fontSize: 28 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Aktif Sistem Uzmanları
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
            {stats?.expertCount}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{
            p: 3,
            textAlign: 'center',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.03) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '16px'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex' }}>
              <Receipt sx={{ color: '#f59e0b', fontSize: 28 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Toplam İşlem / Hacim
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
            {stats?.totalTransactions} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>/ {formatMoney(stats?.totalVolume || 0)}</span>
          </Typography>
        </Paper>
      </Grid>

      {/* CHARTS SECTION */}
      <Grid item xs={12} md={8}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{ p: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', height: '430px' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
            Kullanıcı Bakiyeleri (En Yüksek 15)
          </Typography>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={balanceChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBakiye" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₺${val}`} />
              <ChartTooltip
                contentStyle={{ background: '#111638', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#ffffff', fontWeight: 700 }}
                itemStyle={{ color: '#00d4ff' }}
                formatter={(val: number) => [formatMoney(val), 'Bakiye']}
              />
              <Area type="monotone" dataKey="Bakiye" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#colorBakiye)" />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{ p: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', height: '430px', display: 'flex', flexDirection: 'column' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
            Üyelik Dağılımı
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{ background: '#111638', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* USER MANAGEMENT SECTION */}
      <Grid item xs={12}>
        <Paper
          elevation={0}
          className="glass-card-static"
          sx={{ p: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px' }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Kullanıcı Yönetimi ({filteredUsers.length} Listeleniyor)
            </Typography>
            
            {/* SEARCH AND FILTERS TOOLBAR */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="İsim, Email veya Kullanıcı adı..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: { xs: '100%', sm: '260px' },
                  '& .MuiOutlinedInput-root': {
                    color: 'text.primary',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#00d4ff' }
                  }
                }}
              />

              <FormControl size="small" sx={{ width: '130px' }}>
                <InputLabel id="role-filter-label" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>Rol Filtresi</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  label="Rol Filtresi"
                  onChange={(e) => setRoleFilter(e.target.value)}
                  sx={{
                    color: 'text.primary',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d4ff' }
                  }}
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ width: '140px' }}>
                <InputLabel id="membership-filter-label" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>Üyelik Filtresi</InputLabel>
                <Select
                  labelId="membership-filter-label"
                  value={membershipFilter}
                  label="Üyelik Filtresi"
                  onChange={(e) => setMembershipFilter(e.target.value)}
                  sx={{
                    color: 'text.primary',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d4ff' }
                  }}
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  <MenuItem value="free">FREE</MenuItem>
                  <MenuItem value="bronze">BRONZE</MenuItem>
                  <MenuItem value="silver">SILVER</MenuItem>
                  <MenuItem value="gold">GOLD</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* USERS TABLE */}
          <TableContainer sx={{ background: 'transparent', maxHeight: '550px' }}>
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>Kullanıcı</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>E-posta</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>Rol</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>Plan</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="right">Bakiye</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="center">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                      Kriterlere uygun kullanıcı bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user._id}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': { background: 'rgba(255,255,255,0.02)' }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0, 212, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Person sx={{ color: '#00d4ff', fontSize: 18 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {user.fullName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              @{user.username || 'username'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{user.email}</TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Chip
                            icon={<AdminPanelSettings sx={{ fontSize: '1rem !important' }} />}
                            label="Admin"
                            size="small"
                            sx={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600 }}
                          />
                        ) : user.role === 'expert' ? (
                          <Chip
                            label={`Expert (${user.expertTier?.toUpperCase() || 'BRONZE'})`}
                            size="small"
                            sx={{ background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.3)', fontWeight: 600 }}
                          />
                        ) : (
                          <Chip
                            label="User"
                            size="small"
                            sx={{ background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.2)', fontWeight: 500 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.membership.toUpperCase()}
                          size="small"
                          sx={{
                            background: 'transparent',
                            color: MEMBERSHIP_COLORS[user.membership],
                            border: `1px solid ${MEMBERSHIP_COLORS[user.membership]}`,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#10b981' }}>
                        {formatMoney(user.balance)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <MuiTooltip title="Kullanıcıyı Düzenle">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(user)}
                              sx={{ color: '#00d4ff', '&:hover': { background: 'rgba(0, 212, 255, 0.1)' } }}
                            >
                              <Edit sx={{ fontSize: 20 }} />
                            </IconButton>
                          </MuiTooltip>
                          {!user.isAdmin && (
                            <MuiTooltip title="Kullanıcıyı Sil">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteUser(user._id)}
                                sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239, 68, 68, 0.1)' } }}
                              >
                                <Delete sx={{ fontSize: 20 }} />
                              </IconButton>
                            </MuiTooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* RECENT TRANSACTIONS ACTIVITY LOG */}
      <Grid item xs={12}>
        <Paper
          elevation={0}
          className="glass-card-static"
          sx={{ p: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
            Sistem İşlem Günlükleri (Son 15 Aktivite)
          </Typography>
          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>Kullanıcı</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>İşlem Tipi</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }}>Varlık/Üyelik</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="right">Miktar</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="right">Birim Fiyat</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="right">Toplam Tutar</TableCell>
                  <TableCell sx={{ background: '#111638 !important', color: 'text.secondary', fontWeight: 700 }} align="right">Tarih</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map((tx) => (
                    <TableRow key={tx._id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.01)' } }}>
                      <TableCell>
                        {tx.userId ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {tx.userId.fullName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {tx.userId.email}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            Silinmiş Kullanıcı
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.type === 'deposit' ? (
                          <Chip label="DEPOZİT" size="small" sx={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }} />
                        ) : tx.type === 'upgrade' ? (
                          <Chip label="ABONELİK" size="small" sx={{ background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.3)', fontWeight: 600 }} />
                        ) : tx.type === 'buy' ? (
                          <Chip label="ALIŞ" size="small" sx={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 600 }} />
                        ) : (
                          <Chip label="SATIŞ" size="small" sx={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{tx.symbol}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.primary' }}>{tx.quantity}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.primary' }}>{formatMoney(tx.price)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: tx.type === 'sell' || tx.type === 'deposit' ? '#10b981' : '#ef4444' }}>
                        {tx.type === 'sell' || tx.type === 'deposit' ? '+' : '-'}{formatMoney(tx.total)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {new Date(tx.createdAt).toLocaleString('tr-TR')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                      Sistemde henüz bir işlem kaydı bulunmuyor.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* USER EDIT DIALOG */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        PaperProps={{
          sx: {
            background: '#111638',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            color: 'text.primary',
            minWidth: { xs: '90%', sm: '460px' }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Kullanıcı Düzenle</Typography>
          <IconButton onClick={() => setEditOpen(false)} sx={{ color: 'text.secondary' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)', py: 2.5 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ad Soyad"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& label': { color: 'text.secondary' },
                  '& label.Mui-focused': { color: '#00d4ff' },
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#00d4ff' }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kullanıcı Adı"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                sx={{
                  '& label': { color: 'text.secondary' },
                  '& label.Mui-focused': { color: '#00d4ff' },
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#00d4ff' }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bakiye"
                type="number"
                value={editForm.balance}
                onChange={(e) => setEditForm({ ...editForm, balance: Number(e.target.value) })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney sx={{ color: '#10b981' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& label': { color: 'text.secondary' },
                  '& label.Mui-focused': { color: '#00d4ff' },
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#00d4ff' }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="edit-role-label" sx={{ color: 'text.secondary' }}>Rol</InputLabel>
                <Select
                  labelId="edit-role-label"
                  value={editForm.role}
                  label="Rol"
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d4ff' }
                  }}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="edit-membership-label" sx={{ color: 'text.secondary' }}>Üyelik Planı</InputLabel>
                <Select
                  labelId="edit-membership-label"
                  value={editForm.membership}
                  label="Üyelik Planı"
                  onChange={(e) => setEditForm({ ...editForm, membership: e.target.value })}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d4ff' }
                  }}
                >
                  <MenuItem value="free">FREE</MenuItem>
                  <MenuItem value="bronze">BRONZE</MenuItem>
                  <MenuItem value="silver">SILVER</MenuItem>
                  <MenuItem value="gold">GOLD</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {editForm.role === 'expert' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="edit-expert-tier-label" sx={{ color: 'text.secondary' }}>Expert Seviyesi</InputLabel>
                  <Select
                    labelId="edit-expert-tier-label"
                    value={editForm.expertTier}
                    label="Expert Seviyesi"
                    onChange={(e) => setEditForm({ ...editForm, expertTier: e.target.value })}
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d4ff' }
                    }}
                  >
                    <MenuItem value="bronze">BRONZE</MenuItem>
                    <MenuItem value="silver">SILVER</MenuItem>
                    <MenuItem value="gold">GOLD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setEditOpen(false)}
            sx={{ color: 'text.secondary', fontWeight: 600 }}
          >
            Vazgeç
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
              fontWeight: 700,
              px: 3,
              borderRadius: '8px',
              '&:hover': { background: 'linear-gradient(135deg, #33ddff 0%, #9655f5 100%)' }
            }}
          >
            Değişiklikleri Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
