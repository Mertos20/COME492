import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import GameScore from "../models/GameScore";

const router = Router();

// Liderlik tablosunu getir (En yüksek ilk 10)
router.get("/leaderboard", async (req, res) => {
  try {
    const topScores = await GameScore.find()
      .sort({ score: -1 })
      .limit(10)
      .populate("userId", "fullName")
      .lean();
    
    const formatted = topScores.map((s: any) => ({
      id: s._id,
      userName: s.userId?.fullName || "Bilinmeyen Kullanıcı",
      score: s.score,
    }));
    
    res.json({ leaderboard: formatted });
  } catch (error) {
    res.status(500).json({ message: "Liderlik tablosu alınamadı" });
  }
});

// Yeni skor kaydet (Sadece kullanıcının mevcut en yüksek skorundan büyükse günceller)
router.post("/score", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) { res.status(401).json({ message: "Yetkisiz" }); return; }
    
    const { score } = req.body;
    if (typeof score !== "number") { res.status(400).json({ message: "Geçersiz skor" }); return; }

    const existing = await GameScore.findOne({ userId: req.user.id });
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        await existing.save();
      }
    } else {
      await GameScore.create({ userId: req.user.id, score });
    }
    res.json({ message: "Skor güncellendi" });
  } catch (error) { res.status(500).json({ message: "Skor kaydedilemedi" }); }
});

export default router;