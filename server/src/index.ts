import dotenv from "dotenv";
import path from "path";
import http from "http";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import authRoutes from "./routes/auth";
import marketRoutes from "./routes/market";
import walletRoutes from "./routes/wallet";
import tradeRoutes from "./routes/trade";
import portfolioRoutes from "./routes/portfolio";
import chatRoutes from "./routes/chat";
import aiRoutes from "./routes/ai";
import transactionsRoutes from "./routes/transactions";
import newsRoutes from "./routes/news";
import adminRoutes from "./routes/admin";
import analysisRoutes from "./routes/analysis";
import ChatMessage from "./models/ChatMessage";
import User from "./models/User";
import { seedExperts } from "./utils/seedExperts";
import { getAllInstruments } from "./utils/marketData";
import { processPendingOrders } from "./utils/orderEngine";
import { processAlerts } from "./utils/alertEngine";
import alertsRoutes from "./routes/alerts";
import gameRoutes from "./routes/game";

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const app = express();
const server = http.createServer(app);
const secret = process.env.JWT_SECRET || "dev_secret";

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});
const marketNamespace = io.of("/market");

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: "Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "API istek limiti aşıldı." },
  standardHeaders: true,
  legacyHeaders: false
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "AI danışman istek limiti aşıldı. Lütfen biraz bekleyin." },
  standardHeaders: true,
  legacyHeaders: false
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, platform: "portfol.io" });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api/wallet", apiLimiter, walletRoutes);
app.use("/api/trade", apiLimiter, tradeRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/game", gameRoutes);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      next(new Error("Yetkisiz"));
      return;
    }

    const payload = jwt.verify(token, secret) as {
      id: string;
      fullName: string;
      role: "user" | "expert";
      membership: "free" | "bronze" | "silver" | "gold";
    };

    socket.data.user = payload;
    next();
  } catch {
    next(new Error("Gecersiz token"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user as {
    id: string;
    fullName: string;
    role: "user" | "expert";
    membership: "free" | "bronze" | "silver" | "gold";
  };

  socket.join(`user:${user.id}`);

  if (user.role === "expert") {
    socket.join(`expert:${user.membership}`);
  }

  socket.on("chat:message", async (payload: { tier: "bronze" | "silver" | "gold"; message: string; targetUserId?: string; messageId?: string }) => {
    if (!payload.message?.trim()) {
      return;
    }

    const targetUserId = user.role === "expert" ? payload.targetUserId : user.id;
    if (!targetUserId) {
      return;
    }

    const saved = payload.messageId
      ? await ChatMessage.findById(payload.messageId)
      : await ChatMessage.create({
          userId: targetUserId,
          expertTier: payload.tier,
          senderRole: user.role === "expert" ? "expert" : "user",
          senderName: user.fullName,
          message: payload.message.trim()
        });

    if (!saved) {
      return;
    }

    // Emit to both user room and the relevant expert tier room.
    io.to(`user:${targetUserId}`).emit("chat:new", saved);
    io.to(`expert:${payload.tier}`).emit("chat:new", saved);
  });
});


marketNamespace.on("connection", async (socket) => {
  const snapshot = await getAllInstruments();
  socket.emit("market:update", snapshot);
});

// Global market update and order engine loop
const updateInterval = Number(process.env.MARKET_UPDATE_INTERVAL_MS || 15000);
setInterval(async () => {
  try {
    const updatedSnapshot = await getAllInstruments();
    marketNamespace.emit("market:update", updatedSnapshot);
    await processPendingOrders(updatedSnapshot);
    
    // Process price alerts
    const snapshotMap = updatedSnapshot.reduce((acc, inst) => {
      acc[inst.symbol] = inst;
      return acc;
    }, {} as Record<string, any>);
    await processAlerts(snapshotMap, io);
  } catch (err) {
    console.error("Global market loop error:", err);
  }
}, updateInterval);

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not configured in .env file");
    }
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");

    // Migration: Update users with old 'password' field to 'passwordHash'
    const rawUsers = await User.find({ passwordHash: { $exists: false } }).lean();
    for (const rawUser of rawUsers) {
      if ((rawUser as any).password) {
        await User.updateOne(
          { _id: rawUser._id },
          { 
            $set: { passwordHash: (rawUser as any).password },
            $unset: { password: "" }
          }
        );
        console.log(`[Migration] Migrated user ${rawUser.email || rawUser._id} to use passwordHash`);
      }
    }

    await seedExperts();

    const port = Number(process.env.PORT || 5000);
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
