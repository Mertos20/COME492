import { useEffect, useState, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { api } from "../api";
import type { ChatMessage, ExpertProfile, AuthUser } from "../types";
import { Grid, Paper, Typography, TextField, Button, CircularProgress, Alert, Tabs, Tab, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider } from "@mui/material";
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
    if (!chatText.trim() || !user || !chatSocket) {
      console.warn("❌ Cannot send: text empty, no user, or no socket");
      return;
    }

    try {
      const payload = { tier: activeTier, message: chatText };
      console.log("📤 Sending message:", payload);
      
      chatSocket.emit("chat:message", payload);
      setChatText("");

      // Refresh messages after a short delay
      setTimeout(async () => {
        try {
          const msgRes = await api.get<ChatMessage[]>(`/chat/messages?tier=${activeTier}`);
          console.log("🔄 Refreshed messages:", msgRes.data);
          setMessages(msgRes.data);
        } catch (error) {
          console.error("❌ Failed to refresh messages:", error);
        }
      }, 300);
    } catch (error) {
      console.error("❌ Mesaj gönderilemedi:", error);
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

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={canAccessExperts ? 6 : 12}>
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
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" gutterBottom>Uzmanlarla Canlı Mesajlaşma</Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTier} onChange={(e, newValue) => setActiveTier(newValue)} centered>
              <Tab label="Bronze" value="bronze" disabled={getMembershipLevel(user.membership) < 1} />
              <Tab label="Silver" value="silver" disabled={getMembershipLevel(user.membership) < 2} />
              <Tab label="Gold" value="gold" disabled={getMembershipLevel(user.membership) < 3} />
            </Tabs>
          </Box>
          <Typography variant="caption" display="block" sx={{ my: 1 }}>
            Uygun uzmanlar: {experts.filter(e => e.expertTier === activeTier).map((e) => e.fullName).join(", ") || "Yok"}
          </Typography>
          <Paper variant="outlined" sx={{ flexGrow: 1, p: 2, mb: 2, overflowY: 'auto', bgcolor: 'grey.100' }}>
            <List>
              {messages.map((msg) => (
                <ListItem key={msg._id} sx={{ justifyContent: msg.userId === user.id ? 'flex-end' : 'flex-start' }}>
                  <Box sx={{ display: 'flex', flexDirection: msg.userId === user.id ? 'row-reverse' : 'row', alignItems: 'center', gap: 1 }}>
                    <Avatar>
                      {msg.senderRole === 'user' ? <Person /> : <SmartToy />}
                    </Avatar>
                    <ListItemText
                      primary={msg.senderName}
                      secondary={msg.message}
                      sx={{
                        bgcolor: msg.userId === user.id ? 'primary.light' : 'background.paper',
                        color: msg.userId === user.id ? 'primary.contrastText' : 'text.primary',
                        p: 1.5,
                        borderRadius: 2,
                        textAlign: msg.userId === user.id ? 'right' : 'left',
                      }}
                    />
                  </Box>
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Paper>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }} sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Uzmanınıza mesaj yazın..."
            />
            <Button type="submit" variant="contained"><Send /></Button>
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
