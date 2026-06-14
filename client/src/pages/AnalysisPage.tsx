import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { AuthUser } from "../types";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import {
  Lock,
  WorkspacePremium,
  Assessment,
  CalendarToday,
  BarChart,
  Lightbulb,
  AutoAwesome,
  EventAvailable,
  Star,
  CheckCircle,
} from "@mui/icons-material";
import { useTranslation, Trans } from "react-i18next";

interface ReportsResponse {
  membership: AuthUser["membership"];
  weeklyReport: { title: string; date: string; summary: string; highlights: string[] } | null;
  basicSignals: { symbol: string; signal: string; strength: string; indicator: string }[] | null;
  dailyReport: { title: string; date: string; summary: string; bullets: string[] } | null;
  detailedSignals: { symbol: string; support: string; resistance: string; rsi: number; macd: string; signal: string }[] | null;
  specialRecommendations: { title: string; desc: string }[] | null;
  comprehensiveAnalysis: { orderFlow: string; heatmapData: Record<string, string>; correlations: { pair: string; value: string }[] } | null;
}

// Simple Markdown to JSX parser for premium look
function StrategyRenderer({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return (
            <Typography key={idx} variant="subtitle1" sx={{ fontWeight: 700, color: "#00d4ff", mt: 1.5 }}>
              {trimmed.replace("###", "").trim()}
            </Typography>
          );
        } else if (trimmed.startsWith("##")) {
          return (
            <Typography key={idx} variant="h6" sx={{ fontWeight: 800, color: "#7c3aed", mt: 2, borderBottom: "1px solid rgba(124,58,237,0.2)", pb: 0.5 }}>
              {trimmed.replace("##", "").trim()}
            </Typography>
          );
        } else if (trimmed.startsWith("#")) {
          return (
            <Typography key={idx} variant="h5" sx={{ fontWeight: 900, color: "#ffd700", mt: 2 }}>
              {trimmed.replace("#", "").trim()}
            </Typography>
          );
        } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          return (
            <Box key={idx} sx={{ display: "flex", gap: 1, pl: 1 }}>
              <Typography sx={{ color: "#7c3aed" }}>•</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                {trimmed.substring(1).trim()}
              </Typography>
            </Box>
          );
        } else if (trimmed) {
          return (
            <Typography key={idx} variant="body2" sx={{ color: "text.primary", lineHeight: 1.6 }}>
              {trimmed}
            </Typography>
          );
        }
        return <Box key={idx} sx={{ height: 4 }} />;
      })}
    </Box>
  );
}

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Strategy Builder State (Gold Only)
  const [budget, setBudget] = useState("");
  const [risk, setRisk] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [duration, setDuration] = useState("6 Ay");
  const [strategyResult, setStrategyResult] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get<ReportsResponse>("/analysis/reports");
        setData(res.data);
      } catch (err) {
        setError(t('analysis.error_load'));
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleGenerateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget || Number(budget) <= 0) return;
    setGenerating(true);
    setGenError(null);
    setStrategyResult(null);
    try {
      const res = await api.post<{ strategy: string }>("/analysis/strategy", {
        budget: Number(budget),
        risk,
        duration,
      });
      setStrategyResult(res.data.strategy);
    } catch (err: any) {
      setGenError(err.response?.data?.message || t('analysis.error_strategy'));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return <Alert severity="error">{error || t('analysis.error_data')}</Alert>;
  }

  const membership = data.membership;
  const isBronzeUnlocked = !!data.weeklyReport;
  const isSilverUnlocked = !!data.dailyReport;
  const isGoldUnlocked = !!data.comprehensiveAnalysis;

  // Lock overlay renderer
  const renderLockOverlay = (requiredTier: "bronze" | "silver" | "gold") => (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(10, 14, 39, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        borderRadius: "16px",
        p: 3,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1.5,
        }}
      >
        <Lock sx={{ color: "#ffd700", fontSize: 24 }} />
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#fff", mb: 0.5 }}>
        {t('analysis.locked_title')}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", mb: 2, maxWidth: 260 }}>
        <Trans i18nKey="analysis.locked_desc" values={{ requiredTier: requiredTier.toUpperCase() }}>
          Bu analiz ve raporlara erişmek için en az <strong>{{requiredTier}}</strong> üyeliğe sahip olmalısınız.
        </Trans>
      </Typography>
      <Button
        variant="contained"
        size="small"
        onClick={() => navigate("/subscriptions")}
        sx={{
          background: "linear-gradient(135deg, #7c3aed 0%, #00d4ff 100%)",
          color: "#fff",
          fontWeight: 700,
          px: 3,
          fontSize: "0.75rem",
        }}
      >
        {t('analysis.btn_upgrade')}
      </Button>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          p: 3.5,
          mb: 4,
          borderRadius: "16px",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(0, 212, 255, 0.03) 100%)",
          border: "1px solid rgba(124, 58, 237, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Assessment sx={{ color: "#7c3aed", fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t('analysis.title')}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 650 }}>
          {t('analysis.subtitle')}
        </Typography>
        <Chip
          icon={<WorkspacePremium sx={{ color: "#ffd700 !important" }} />}
          label={t('analysis.current_membership', { membership: membership.toUpperCase() })}
          sx={{
            position: "absolute",
            top: 24,
            right: 24,
            display: { xs: "none", sm: "inline-flex" },
            fontWeight: 700,
            background: "rgba(255,215,0,0.1)",
            border: "1px solid rgba(255,215,0,0.3)",
            color: "#ffd700",
          }}
        />
      </Box>

      {/* Grid Content */}
      <Grid container spacing={3}>
        {/* BRONZE BLOCK */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "16px",
                background: "rgba(205, 127, 50, 0.04)",
                border: "1px solid rgba(205, 127, 50, 0.25)",
                minHeight: 320,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#cd7f32", display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarToday /> {t('analysis.weekly_report')}
                </Typography>
                <Chip label="BRONZE" size="small" sx={{ background: "#cd7f32", color: "#000", fontWeight: 700, fontSize: "0.65rem" }} />
              </Box>

              {isBronzeUnlocked && data.weeklyReport ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {data.weeklyReport.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                    {data.weeklyReport.date}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.primary", mb: 2, lineHeight: 1.6 }}>
                    {data.weeklyReport.summary}
                  </Typography>
                  <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.06)" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: "0.8rem", color: "#cd7f32" }}>
                    {t('analysis.highlights')}
                  </Typography>
                  {data.weeklyReport.highlights.map((h, i) => (
                    <Typography key={i} variant="body2" sx={{ color: "text.secondary", mb: 0.5, display: "flex", gap: 1 }}>
                      <span style={{ color: "#cd7f32" }}>•</span> {h}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Box sx={{ height: 180 }} />
              )}
            </Paper>
            {!isBronzeUnlocked && renderLockOverlay("bronze")}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "16px",
                background: "rgba(205, 127, 50, 0.04)",
                border: "1px solid rgba(205, 127, 50, 0.25)",
                minHeight: 320,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#cd7f32", display: "flex", alignItems: "center", gap: 1 }}>
                  <BarChart /> {t('analysis.basic_signals')}
                </Typography>
                <Chip label="BRONZE" size="small" sx={{ background: "#cd7f32", color: "#000", fontWeight: 700, fontSize: "0.65rem" }} />
              </Box>

              {isBronzeUnlocked && data.basicSignals ? (
                <TableContainer component={Box}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{t('analysis.table_symbol')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('analysis.table_signal')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('analysis.table_strength')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('analysis.table_indicator')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.basicSignals.map((s) => (
                        <TableRow key={s.symbol}>
                          <TableCell sx={{ fontWeight: 700, color: "#00d4ff" }}>{s.symbol}</TableCell>
                          <TableCell>
                            <Chip
                              label={s.signal}
                              size="small"
                              sx={{
                                background: s.signal.includes("AL") ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                                color: s.signal.includes("AL") ? "#10b981" : "#f59e0b",
                                fontWeight: 700,
                                fontSize: "0.65rem",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>{s.strength}</TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>{s.indicator}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ height: 180 }} />
              )}
            </Paper>
            {!isBronzeUnlocked && renderLockOverlay("bronze")}
          </Box>
        </Grid>

        {/* SILVER BLOCK */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "16px",
                background: "rgba(192, 192, 192, 0.04)",
                border: "1px solid rgba(192, 192, 192, 0.25)",
                minHeight: 350,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#c0c0c0", display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarToday /> {t('analysis.daily_bulletin')}
                </Typography>
                <Chip label="SILVER" size="small" sx={{ background: "#c0c0c0", color: "#000", fontWeight: 700, fontSize: "0.65rem" }} />
              </Box>

              {isSilverUnlocked && data.dailyReport ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {data.dailyReport.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                    {data.dailyReport.date}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.primary", mb: 2, lineHeight: 1.6 }}>
                    {data.dailyReport.summary}
                  </Typography>
                  <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.06)" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: "0.8rem", color: "#c0c0c0" }}>
                    {t('analysis.daily_developments')}
                  </Typography>
                  {data.dailyReport.bullets.map((b, i) => (
                    <Typography key={i} variant="body2" sx={{ color: "text.secondary", mb: 0.5, display: "flex", gap: 1 }}>
                      <span style={{ color: "#c0c0c0" }}>•</span> {b}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Box sx={{ height: 210 }} />
              )}
            </Paper>
            {!isSilverUnlocked && renderLockOverlay("silver")}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "16px",
                background: "rgba(192, 192, 192, 0.04)",
                border: "1px solid rgba(192, 192, 192, 0.25)",
                minHeight: 350,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#c0c0c0", display: "flex", alignItems: "center", gap: 1 }}>
                  <BarChart /> {t('analysis.detailed_analysis')}
                </Typography>
                <Chip label="SILVER" size="small" sx={{ background: "#c0c0c0", color: "#000", fontWeight: 700, fontSize: "0.65rem" }} />
              </Box>

              {isSilverUnlocked && data.detailedSignals ? (
                <TableContainer component={Box}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t('analysis.table_symbol')}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t('analysis.table_support_resistance')}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t('analysis.table_rsi')}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t('analysis.table_macd')}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t('analysis.table_signal')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.detailedSignals.map((s) => (
                        <TableRow key={s.symbol}>
                          <TableCell sx={{ fontWeight: 700, color: "#00d4ff", fontSize: "0.8rem" }}>{s.symbol}</TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem" }}>{s.support} / {s.resistance}</TableCell>
                          <TableCell sx={{ color: s.rsi > 70 ? "#ef4444" : s.rsi < 30 ? "#10b981" : "text.secondary", fontWeight: 600, fontSize: "0.8rem" }}>
                            {s.rsi}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem" }}>{s.macd}</TableCell>
                          <TableCell>
                            <Chip
                              label={s.signal}
                              size="small"
                              sx={{
                                background: s.signal.includes("AL") ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                                color: s.signal.includes("AL") ? "#10b981" : "#f59e0b",
                                fontWeight: 700,
                                fontSize: "0.65rem",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ height: 210 }} />
              )}
            </Paper>
            {!isSilverUnlocked && renderLockOverlay("silver")}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "16px",
                background: "rgba(192, 192, 192, 0.04)",
                border: "1px solid rgba(192, 192, 192, 0.25)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#c0c0c0", display: "flex", alignItems: "center", gap: 1 }}>
                  <Lightbulb /> {t('analysis.special_recommendations')}
                </Typography>
                <Chip label="SILVER" size="small" sx={{ background: "#c0c0c0", color: "#000", fontWeight: 700, fontSize: "0.65rem" }} />
              </Box>

              {isSilverUnlocked && data.specialRecommendations ? (
                <Grid container spacing={2}>
                  {data.specialRecommendations.map((r, i) => (
                    <Grid key={i} item xs={12} md={6}>
                      <Box sx={{ p: 2.5, borderRadius: "12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.06)", height: "100%" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#00d4ff", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 18 }} /> {r.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                          {r.desc}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ height: 100 }} />
              )}
            </Paper>
            {!isSilverUnlocked && renderLockOverlay("silver")}
          </Box>
        </Grid>

        {/* GOLD BLOCK */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "16px",
                background: "rgba(255, 215, 0, 0.04)",
                border: "1px solid rgba(255, 215, 0, 0.25)",
                minHeight: 350,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffd700", display: "flex", alignItems: "center", gap: 1 }}>
                  <Star /> {t('analysis.institutional_analysis')}
                </Typography>
                <Chip label="GOLD" size="small" sx={{ background: "#ffd700", color: "#000", fontWeight: 700, fontSize: "0.65rem" }} />
              </Box>

              {isGoldUnlocked && data.comprehensiveAnalysis ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#ffd700" }}>
                    {t('analysis.order_flow')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.primary", mb: 2, lineHeight: 1.6 }}>
                    {data.comprehensiveAnalysis.orderFlow}
                  </Typography>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#ffd700" }}>
                    {t('analysis.correlations')}
                  </Typography>
                  {data.comprehensiveAnalysis.correlations.map((c, i) => (
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.5, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>{c.pair}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#00d4ff" }}>{c.value}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ height: 210 }} />
              )}
            </Paper>
            {!isGoldUnlocked && renderLockOverlay("gold")}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "16px",
                background: "rgba(255, 215, 0, 0.04)",
                border: "1px solid rgba(255, 215, 0, 0.25)",
                minHeight: 350,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffd700", display: "flex", alignItems: "center", gap: 1 }}>
                  <EventAvailable /> {t('analysis.events')}
                </Typography>
                <Chip label="GOLD" size="small" sx={{ background: "#ffd700", color: "#000", fontWeight: 700, fontSize: "0.65rem" }} />
              </Box>

              {isGoldUnlocked ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                    {t('analysis.summit_title')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                    {t('analysis.summit_date')}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      border: "2px dashed #ffd700",
                      background: "rgba(255,215,0,0.08)",
                      borderRadius: "12px",
                      maxWidth: 240,
                      mx: "auto",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                      {t('analysis.entry_code')}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: "#ffd700", letterSpacing: 3 }}>
                      PORTGOLD26
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: 210 }} />
              )}
            </Paper>
            {!isGoldUnlocked && renderLockOverlay("gold")}
          </Box>
        </Grid>

        {/* AI STRATEGY BUILDER - GOLD ONLY */}
        <Grid item xs={12}>
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)",
                border: "1px solid rgba(255, 215, 0, 0.25)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#ffd700", display: "flex", alignItems: "center", gap: 1 }}>
                  <AutoAwesome /> {t('analysis.ai_strategy_title')}
                </Typography>
                <Chip label="GOLD" size="small" sx={{ background: "#ffd700", color: "#000", fontWeight: 700, fontSize: "0.65rem" }} />
              </Box>

              {isGoldUnlocked ? (
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                    {t('analysis.ai_strategy_desc')}
                  </Typography>

                  <Box component="form" onSubmit={handleGenerateStrategy} sx={{ display: "flex", flexWrap: "wrap", gap: 2.5, mb: 4 }}>
                    <TextField
                      label={t('analysis.budget_label')}
                      variant="outlined"
                      type="number"
                      required
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder={t('analysis.budget_placeholder')}
                      sx={{ flex: 1, minWidth: 200 }}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />

                    <FormControl sx={{ flex: 1, minWidth: 200 }}>
                      <InputLabel id="risk-select-label" shrink>{t('analysis.risk_label')}</InputLabel>
                      <Select
                        labelId="risk-select-label"
                        id="risk-select"
                        value={risk}
                        onChange={(e) => setRisk(e.target.value as any)}
                        label={t('analysis.risk_label')}
                        notched
                      >
                        <MenuItem value="conservative">{t('analysis.risk_low')}</MenuItem>
                        <MenuItem value="moderate">{t('analysis.risk_medium')}</MenuItem>
                        <MenuItem value="aggressive">{t('analysis.risk_high')}</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl sx={{ flex: 1, minWidth: 150 }}>
                      <InputLabel id="duration-select-label" shrink>{t('analysis.duration_label')}</InputLabel>
                      <Select
                        labelId="duration-select-label"
                        id="duration-select"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        label={t('analysis.duration_label')}
                        notched
                      >
                        <MenuItem value="3 Ay">{t('analysis.duration_3m')}</MenuItem>
                        <MenuItem value="6 Ay">{t('analysis.duration_6m')}</MenuItem>
                        <MenuItem value="1 Yıl">{t('analysis.duration_1y')}</MenuItem>
                        <MenuItem value="3 Yıl+">{t('analysis.duration_3y')}</MenuItem>
                      </Select>
                    </FormControl>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={generating}
                      sx={{
                        background: "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)",
                        color: "#000",
                        fontWeight: 700,
                        px: 4,
                        "&:hover": { background: "linear-gradient(135deg, #ffee55 0%, #ffa500 100%)" },
                      }}
                    >
                      {generating ? <CircularProgress size={24} sx={{ color: "#000" }} /> : t('analysis.btn_generate')}
                    </Button>
                  </Box>

                  {genError && <Alert severity="error" sx={{ mb: 3 }}>{genError}</Alert>}

                  {strategyResult && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "12px",
                        animation: "fadeIn 0.5s ease-out",
                      }}
                    >
                      <StrategyRenderer text={strategyResult} />
                    </Paper>
                  )}
                </Box>
              ) : (
                <Box sx={{ height: 160 }} />
              )}
            </Paper>
            {!isGoldUnlocked && renderLockOverlay("gold")}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
