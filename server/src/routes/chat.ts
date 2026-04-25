import { Router } from "express";
import { AuthRequest, requireAuth, requireExpert, requirePaidMembership } from "../middleware/auth";
import ChatMessage from "../models/ChatMessage";
import User from "../models/User";

const router = Router();

const canAccessTier = (
  membership: "free" | "bronze" | "silver" | "gold",
  tier: "bronze" | "silver" | "gold"
): boolean => {
  if (membership === "gold") return true;
  if (membership === "silver") return tier !== "gold";
  if (membership === "bronze") return tier === "bronze";
  return false;
};

const getExpertTierFromMembership = (
  membership: "free" | "bronze" | "silver" | "gold"
): "bronze" | "silver" | "gold" | null => {
  if (membership === "bronze" || membership === "silver" || membership === "gold") {
    return membership;
  }
  return null;
};

router.get("/experts", requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Yetkilendirilmemiş" });
    return;
  }

  // Determine which tiers the user can access based on membership
  const accessibleTiers: ("bronze" | "silver" | "gold")[] = [];
  
  if (req.user.membership === "bronze") {
    accessibleTiers.push("bronze");
  } else if (req.user.membership === "silver") {
    accessibleTiers.push("bronze", "silver");
  } else if (req.user.membership === "gold") {
    accessibleTiers.push("bronze", "silver", "gold");
  } else {
    res.status(403).json({ message: "Uzman erişim için ödeme yapmanız gerekmektedir" });
    return;
  }

  const experts = await User.find({ 
    role: "expert",
    expertTier: { $in: accessibleTiers }
  }).select("fullName expertTier").lean();
  
  res.json(experts);
});

router.get("/messages", requireAuth, requirePaidMembership, async (req: AuthRequest, res) => {
  const tier = req.query.tier as "bronze" | "silver" | "gold";
  const targetUserId = req.query.userId as string | undefined;

  if (!tier || !["bronze", "silver", "gold"].includes(tier)) {
    res.status(400).json({ message: "Gecersiz uzman seviyesi" });
    return;
  }

  if (!req.user || !canAccessTier(req.user.membership, tier)) {
    res.status(403).json({ message: "Bu uzman seviyesine erisimin yok" });
    return;
  }

  const userIdForQuery = req.user.role === "expert" ? targetUserId : req.user.id;
  if (req.user.role === "expert" && !userIdForQuery) {
    res.status(400).json({ message: "Uzman paneli icin userId zorunlu" });
    return;
  }

  const senderRoleToMarkRead = req.user.role === "expert" ? "user" : "expert";
  await ChatMessage.updateMany(
    {
      userId: userIdForQuery,
      expertTier: tier,
      senderRole: senderRoleToMarkRead,
      readAt: null
    },
    { $set: { readAt: new Date() } }
  );

  const messages = await ChatMessage.find({ userId: userIdForQuery, expertTier: tier }).sort({ createdAt: 1 }).lean();
  res.json(messages);
});

router.post("/messages", requireAuth, requirePaidMembership, async (req: AuthRequest, res) => {
  const { tier, message, targetUserId } = req.body as {
    tier: "bronze" | "silver" | "gold";
    message: string;
    targetUserId?: string;
  };

  if (!tier || !["bronze", "silver", "gold"].includes(tier)) {
    res.status(400).json({ message: "Gecersiz uzman seviyesi" });
    return;
  }

  if (!message?.trim()) {
    res.status(400).json({ message: "Mesaj bos olamaz" });
    return;
  }

  if (!req.user || !canAccessTier(req.user.membership, tier)) {
    res.status(403).json({ message: "Bu uzman seviyesine erisimin yok" });
    return;
  }

  const userId = req.user.role === "expert" ? targetUserId : req.user.id;
  if (!userId) {
    res.status(400).json({ message: "Uzman paneli icin hedef kullanici zorunlu" });
    return;
  }

  const saved = await ChatMessage.create({
    userId,
    expertTier: tier,
    senderRole: req.user.role === "expert" ? "expert" : "user",
    senderName: req.user?.fullName || "Kullanici",
    message: message.trim(),
    readAt: null
  });

  res.status(201).json(saved);
});

router.get("/expert/conversations", requireAuth, requireExpert, async (req: AuthRequest, res) => {
  const tier = getExpertTierFromMembership(req.user?.membership || "free");
  if (!tier) {
    res.status(400).json({ message: "Uzman seviyesi tanimli degil" });
    return;
  }

  const messages = await ChatMessage.find({ expertTier: tier }).sort({ createdAt: -1 }).lean();
  const latestByUser = new Map<string, (typeof messages)[number]>();

  for (const message of messages) {
    const key = String(message.userId);
    if (!latestByUser.has(key)) {
      latestByUser.set(key, message);
    }
  }

  const userIds = Array.from(latestByUser.keys());
  const users = await User.find({ _id: { $in: userIds } }).select("fullName").lean();
  const nameMap = new Map(users.map((user) => [String(user._id), user.fullName]));

  const queue = userIds.map((id) => {
    const latest = latestByUser.get(id);
    return {
      userId: id,
      userName: nameMap.get(id) || "Kullanici",
      latestMessage: latest?.message || "",
      latestAt: latest?.createdAt || null
    };
  });

  res.json(queue);
});

export default router;
