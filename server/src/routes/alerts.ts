import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import Alert from "../models/Alert";

const router = Router();

// GET all active alerts for user
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user?.id }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// POST add new alert
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { symbol, targetPrice, condition } = req.body;
    if (!symbol || !targetPrice || !condition) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur" });
    }

    const newAlert = await Alert.create({
      userId: req.user?.id,
      symbol: symbol.toUpperCase(),
      targetPrice: Number(targetPrice),
      condition
    });

    res.status(201).json(newAlert);
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// DELETE remove alert
router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
    if (!alert) {
      return res.status(404).json({ message: "Alarm bulunamadı" });
    }
    res.json({ message: "Alarm silindi", id: alert._id });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

export default router;
