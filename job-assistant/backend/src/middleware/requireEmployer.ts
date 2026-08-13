import type { NextFunction, Request, Response } from "express";

export function requireEmployer(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "EMPLOYER") {
    return res.status(403).json({ error: "Employer account required" });
  }
  next();
}
