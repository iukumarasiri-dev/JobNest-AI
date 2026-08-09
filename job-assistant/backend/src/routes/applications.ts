import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { groq } from "../lib/ai/client.js";
import { buildCoverLetterPrompt } from "../lib/ai/prompts/coverLetter.js";

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);

const applicationSchema = z.object({
  companyName: z.string().min(1),
  jobTitle: z.string().min(1),
  jobDescription: z.string().min(1),
  resumeId: z.string().optional(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  jobUrl: z.string().optional(),
});

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  jobTitle: z.string().min(1).optional(),
  jobDescription: z.string().min(1).optional(),
  status: z.enum(["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"]).optional(),
  notes: z.string().optional(),
  appliedDate: z.string().datetime().optional(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  jobUrl: z.string().optional(),
});

applicationsRouter.get("/", async (req, res) => {
  const status = req.query.status as string | undefined;
  const applications = await prisma.application.findMany({
    where: { userId: req.user!.id, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: { resume: true },
  });
  res.json(applications);
});

applicationsRouter.post("/", async (req, res) => {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const application = await prisma.application.create({
    data: { ...parsed.data, userId: req.user!.id },
  });
  res.status(201).json(application);
});

applicationsRouter.get("/:id", async (req, res) => {
  const application = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { resume: true, generatedContent: true },
  });
  if (!application) return res.status(404).json({ error: "Not found" });
  res.json(application);
});

applicationsRouter.put("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.application.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      appliedDate: parsed.data.appliedDate ? new Date(parsed.data.appliedDate) : undefined,
    },
  });
  res.json(updated);
});

applicationsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  await prisma.application.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

applicationsRouter.get("/:id/generated", async (req, res) => {
  const application = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!application) return res.status(404).json({ error: "Not found" });

  const content = await prisma.generatedContent.findMany({
    where: { applicationId: req.params.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(content);
});

applicationsRouter.post("/:id/generate/cover-letter", async (req, res) => {
  const application = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { resume: true },
  });

  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }

  if (!application.resume?.rawText) {
    return res.status(400).json({
      error: "This application has no resume attached. Attach a resume first.",
    });
  }

  const prompt = buildCoverLetterPrompt({
    jobTitle: application.jobTitle,
    companyName: application.companyName,
    jobDescription: application.jobDescription,
    resumeText: application.resume.rawText,
  });

  let parsed: { coverLetter: string; keyPointsUsed: string[] };

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from model");

    parsed = JSON.parse(raw);

    if (!parsed.coverLetter || typeof parsed.coverLetter !== "string") {
      throw new Error("Malformed response: missing coverLetter field");
    }
  } catch (err) {
    console.error("Cover letter generation failed:", err);
    return res.status(502).json({ error: "Failed to generate cover letter. Please try again." });
  }

  const saved = await prisma.generatedContent.create({
    data: {
      applicationId: application.id,
      type: "cover_letter",
      content: parsed,
      modelUsed: "llama-3.3-70b-versatile",
      promptVersion: "v1",
    },
  });

  res.status(201).json(saved);
});
