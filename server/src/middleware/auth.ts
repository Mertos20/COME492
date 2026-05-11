import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

export interface AuthRequest extends Request {
  user?: IUser;
}

const getSecret = (): string => process.env.JWT_SECRET || "dev_secret";

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "Yetkisiz istek" });
    return;
  }

  try {
    const payload = jwt.verify(token, getSecret()) as { id: string };
    const user = await User.findById(payload.id).select("-password");

    if (!user) {
      res.status(401).json({ message: "Kullanıcı bulunamadı" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
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
