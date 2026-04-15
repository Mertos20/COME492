import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    membership: "free" | "bronze" | "silver" | "gold";
    role: "user" | "expert";
    fullName: string;
  };
}

const secret = process.env.JWT_SECRET || "dev_secret";

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "Yetkisiz istek" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthRequest["user"];
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Geçersiz token" });
  }
};

export const requirePaidMembership = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.membership === "free") {
    res.status(403).json({ message: "Bu özellik sadece ücretli üyeler için" });
    return;
  }
  next();
};

export const requireExpert = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== "expert") {
    res.status(403).json({ message: "Bu alan sadece uzmanlar icin" });
    return;
  }
  next();
};
