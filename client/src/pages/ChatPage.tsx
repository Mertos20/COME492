import { useEffect, useState, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { api } from "../api";
import type { ChatMessage, ExpertProfile, AuthUser } from "../types";
import { Grid, Paper, Typography, TextField, Button, CircularProgress, Alert, Tabs, Tab, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip } from "@mui/material";
import { Send, SmartToy, Person } from '@mui/icons-material';

interface ChatPageProps {
  user: AuthUser | null;
  token: string | null;
}

export default function ChatPage({ user, token }: ChatPageProps) {
  const [activeTier, setActiveTier] = useState<"bronze" | "silver" | "gold">("bronze");
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("AI danışman burada. Piyasalar hakkında soru sorabilirsiniz.");
  const [loadingAi, setLoadingAi] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!token || !user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const instance = io(socketUrl, { auth: { token } });

    instance.on("connect", () => {
      console.log("✅ Socket.io connected");
    });

    instance.on("connect_error", (error) => {
      console.error("❌ Socket connect error:", error.message);
    });

    instance.on("chat:new", (incoming: ChatMessage) => {
      console.log("📨 Incoming message:", incoming);
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((item) => item._id === incoming._id)) {
          return prev;
        }
        return [...prev, incoming];
      });
    });

    instance.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });

    setChatSocket(instance);
    return () => {
      instance.disconnect();
    };
  }, [token, user]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== "user") return;
      try {
        const [expertsRes, msgRes] = await Promise.all([
            api.get<ExpertProfile[]>("/chat/experts"),
            api.get<ChatMessage[]>(`/chat/messages?tier=${activeTier}`)
        ]);
        setExperts(expertsRes.data);
        setMessages(msgRes.data);
        console.log("✅ Loaded messages for tier:", activeTier, msgRes.data);
      } catch (error) {
        console.error("❌ Veri yüklenemedi:", error);
      }
    };

    loadData();
  }, [user, activeTier]);

  const sendMessage = async () => {
    if (!chatText.trim() || !user) {
      console.warn("❌ Cannot send: text empty or no user");
      return;
    }

    try {
      setSendError(null);
      const payload = { tier: activeTier, message: chatText.trim() };
      console.log("📤 Sending message:", payload);

      // Persist first so message is not lost if socket connection is down.
      const savedRes = await api.post<ChatMessage>("/chat/messages", payload);
      setMessages((prev) => {
        if (prev.some((item) => item._id === savedRes.data._id)) {
          return prev;
        }
        return [...prev, savedRes.data];
      });

      if (chatSocket?.connected) {
        chatSocket.emit("chat:message", { ...payload, messageId: savedRes.data._id });
      }

      setChatText("");
    } catch (error) {
      console.error("❌ Mesaj gönderilemedi:", error);
      setSendError("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setLoadingAi(true);
    try {
      const res = await api.post<{ response: string }>("/ai/chat", { message: aiQuestion });
      setAiAnswer(res.data.response);
      setAiQuestion("");
    } catch {
      setAiAnswer("Üzgünüm, AI danışman şu an kullanılamıyor.");
    } finally {
        setLoadingAi(false);
    }
  };

  if (!user || user.role !== "user") {
    return (
      <Alert severity="warning">
        Bu sayfa sadece Kullanıcı paneli için erişilebilir.
      </Alert>
    );
  }

  const canAccessExperts = user.membership !== "free";
  const tierExperts = experts.filter((e) => e.expertTier === activeTier);

  return (
    <Grid container spacing={4}>
      <Grid xs={12} md={canAccessExperts ? 6 : 12}>
        <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToy sx={{ mr: 1 }} /> AI Yatırım Danışmanı
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Yatırım ve finansal konulardaki sorularınızı sorun. Gemini AI tarafından destekleniyor.
          </Typography>
          <Paper variant="outlined" sx={{ flexGrow: 1, p: 2, mb: 2, overflowY: 'auto', bgcolor: 'grey.100' }}>
            <List>
                <ListItem>
                    <ListItemAvatar>
                        <Avatar><SmartToy /></Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="AI Danışman" secondary={aiAnswer} 
                        sx={{
                            bgcolor: 'background.paper',
                            p: 1.5,
                            borderRadius: 2,
                        }}
                    />
                </ListItem>
            </List>
          </Paper>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); askAI(); }} sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Örn: Bitcoin için risk nasıl yönetilir?"
              disabled={loadingAi}
            />
            <Button type="submit" variant="contained" disabled={loadingAi}>
              {loadingAi ? <CircularProgress size={24} /> : <Send />}
            </Button>
          </Box>
        </Paper>
      </Grid>

      {canAccessExperts && (
      <Grid xs={12} md={6}>
        <Paper
          elevation={3}
          sx={{
            p: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 3
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 2,
              background: 'linear-gradient(135deg, #f6f9ff 0%, #eef5ff 100%)',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Uzmanlarla Canli Mesajlasma
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gercek zamanli destek alin, stratejinizi uzmanlarla netlestirin.
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" label={`${activeTier.toUpperCase()} kanali`} color="primary" variant="outlined" />
              <Chip
                size="small"
                label={`${tierExperts.length} uzman aktif`}
                sx={{ bgcolor: 'success.light', color: 'success.dark', fontWeight: 600 }}
              />
            </Box>
          </Box>

          <Box sx={{ px: 2, pt: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTier}
              onChange={(_e, newValue) => setActiveTier(newValue)}
              centered
              sx={{
                '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
                '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' }
              }}
            >
              <Tab label="Bronze" value="bronze" disabled={getMembershipLevel(user.membership) < 1} />
              <Tab label="Silver" value="silver" disabled={getMembershipLevel(user.membership) < 2} />
              <Tab label="Gold" value="gold" disabled={getMembershipLevel(user.membership) < 3} />
            </Tabs>
          </Box>

          <Typography variant="caption" display="block" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            Uygun uzmanlar: {tierExperts.map((e) => e.fullName).join(", ") || "Yok"}
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              flexGrow: 1,
              mx: 2,
              mb: 2,
              p: 1.5,
              overflowY: 'auto',
              bgcolor: '#f7f9fc',
              borderRadius: 2.5,
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(25,118,210,0.08) 1px, transparent 0) ',
              backgroundSize: '16px 16px'
            }}
          >
            <List sx={{ p: 0 }}>
              {messages.length === 0 && (
                <ListItem>
                  <Alert severity="info" sx={{ width: '100%' }}>
                    Henüz mesaj yok. Uzmanla konusmaya baslamak icin ilk mesaji gonderin.
                  </Alert>
                </ListItem>
              )}

              {messages.map((msg) => {
                const displayName = msg.senderRole === 'user' ? user.fullName : msg.senderName;
                return (
                  <ListItem key={msg._id} sx={{ justifyContent: msg.senderRole === 'user' ? 'flex-end' : 'flex-start', px: 0.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: msg.senderRole === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 1 }}>
                      <Avatar sx={{ width: 34, height: 34 }}>
                        {msg.senderRole === 'user' ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {displayName}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                color: msg.senderRole === 'user' ? 'primary.contrastText' : 'text.primary'
                              }}
                            >
                              {msg.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                mt: 0.5,
                                display: 'block',
                                opacity: 0.8,
                                textAlign: msg.senderRole === 'user' ? 'right' : 'left',
                                color: msg.senderRole === 'user' ? 'primary.contrastText' : 'text.secondary'
                              }}
                            >
                              {formatMessageTime(msg.createdAt)}
                              {msg.senderRole === 'user' ? ` • ${formatReadStatus(msg.readAt)}` : ''}
                            </Typography>
                          </>
                        }
                        sx={{
                          bgcolor: msg.senderRole === 'user' ? 'primary.main' : 'common.white',
                          color: msg.senderRole === 'user' ? 'primary.contrastText' : 'text.primary',
                          p: 1.5,
                          borderRadius: msg.senderRole === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          textAlign: msg.senderRole === 'user' ? 'right' : 'left',
                          border: msg.senderRole === 'user' ? 'none' : '1px solid',
                          borderColor: msg.senderRole === 'user' ? 'transparent' : 'grey.300',
                          boxShadow: msg.senderRole === 'user' ? '0 10px 20px rgba(25,118,210,0.22)' : '0 6px 12px rgba(15,23,42,0.08)',
                          minWidth: 170,
                          maxWidth: { xs: 220, sm: 300 }
                        }}
                      />
                    </Box>
                  </ListItem>
                );
              })}
              <div ref={messagesEndRef} />
            </List>
          </Paper>
          {sendError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {sendError}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            sx={{ display: 'flex', gap: 1, p: 2, pt: 0, borderTop: '1px solid', borderColor: 'divider' }}
          >
            <TextField
              fullWidth
              variant="outlined"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Uzmanınıza mesaj yazın..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }}
            />
            <Button type="submit" variant="contained" sx={{ minWidth: 52, borderRadius: 3 }}><Send /></Button>
          </Box>
        </Paper>
      </Grid>
      )}
    </Grid>
  );
}

const getMembershipLevel = (tier: string): number => {
    const levels: Record<string, number> = { free: 0, bronze: 1, silver: 2, gold: 3 };
    return levels[tier] || 0;
};

const formatMessageTime = (value: string): string =>
  new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  });

const formatReadStatus = (readAt?: string | null): string => {
  if (!readAt) {
    return "Gonderildi";
  }

  return `Okundu ${new Date(readAt).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
};
