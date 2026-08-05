import type { NextFunction, Request, Response } from "express";
import { getUserFromRequest } from "../lib/session.js";
import type { User } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.user = user;
  next();
}
