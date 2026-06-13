import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

export const admin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as IUser;
  if (user && user.isAdmin) {
    next();
  } else {
    res.status(403).send('Access Denied. Admin role required.');
  }
};
