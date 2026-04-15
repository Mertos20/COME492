import { Router } from "express";
import { getAllInstruments, getPopularInstruments } from "../utils/marketData";

const router = Router();

router.get("/popular", async (_req, res) => {
  const data = await getPopularInstruments();
  res.json(data);
});

router.get("/all", async (_req, res) => {
  const data = await getAllInstruments();
  res.json(data);
});

export default router;
