import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireEmployer } from "../middleware/requireEmployer.js";

export const companyRouter = Router();
companyRouter.use(requireAuth, requireEmployer);

const updateSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  logoUrl: z.url().max(2048).optional().or(z.literal("")),
  description: z.string().max(4000).optional(),
  industry: z.string().max(120).optional(),
  size: z.string().max(60).optional(),
  website: z.url().max(2048).optional().or(z.literal("")),
});

companyRouter.get("/me", async (req, res) => {
  const company = await prisma.company.findUnique({ where: { ownerId: req.user!.id } });
  if (!company) return res.status(404).json({ error: "No company profile found" });
  res.json(company);
});

companyRouter.patch("/me", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await prisma.company.update({
    where: { ownerId: req.user!.id },
    data: parsed.data,
  });
  res.json(company);
});
