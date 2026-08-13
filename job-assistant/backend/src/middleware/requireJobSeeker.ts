import type { NextFunction, Request, Response } from "express";

export function requireJobSeeker(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "JOB_SEEKER") {
    return res.status(403).json({ error: "Job seeker account required" });
  }
  next();
}
