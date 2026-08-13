import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireJobSeeker } from "../middleware/requireJobSeeker.js";

export const resumesRouter = Router();
resumesRouter.use(requireAuth, requireJobSeeker);

const resumeSchema = z.object({
  title: z.string().min(1),
  rawText: z.string().min(1),
});

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!SUPPORTED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Unsupported file type. Upload a PDF or DOCX file."));
      return;
    }
    cb(null, true);
  },
});

function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 5MB)." : err.message;
      return res.status(400).json({ error: message });
    }
    if (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Failed to upload file." });
    }
    next();
  });
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  rawText: z.string().min(1).optional(),
  isPrimary: z.boolean().optional(),
});

resumesRouter.get("/", async (req, res) => {
  const resumes = await prisma.resume.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(resumes);
});

resumesRouter.post("/", async (req, res) => {
  const parsed = resumeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const resume = await prisma.resume.create({
    data: { ...parsed.data, userId: req.user!.id },
  });
  res.status(201).json(resume);
});

resumesRouter.post("/upload", handleUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const { originalname, mimetype, size, buffer } = req.file;
  const title = (req.body.title as string | undefined)?.trim() || originalname.replace(/\.[^/.]+$/, "");

  let rawText: string;
  try {
    if (mimetype === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText({ pageJoiner: "" });
      await parser.destroy();
      rawText = result.text;
    } else {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    }
  } catch (err) {
    console.error("Resume file parsing failed:", err);
    return res.status(422).json({ error: "Failed to parse this file. Please try a different file." });
  }

  rawText = rawText.trim();
  if (!rawText) {
    return res.status(422).json({ error: "Couldn't extract any text from this file." });
  }

  const resume = await prisma.resume.create({
    data: {
      title,
      rawText,
      userId: req.user!.id,
      content: {
        fileName: originalname,
        fileType: mimetype,
        fileSize: size,
        uploadedAt: new Date().toISOString(),
      },
    },
  });
  res.status(201).json(resume);
});

resumesRouter.get("/:id", async (req, res) => {
  const resume = await prisma.resume.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!resume) return res.status(404).json({ error: "Not found" });
  res.json(resume);
});

resumesRouter.put("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.resume.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.isPrimary === true) {
      await tx.resume.updateMany({
        where: { userId: req.user!.id, id: { not: req.params.id } },
        data: { isPrimary: false },
      });
    }
    return tx.resume.update({ where: { id: req.params.id }, data: parsed.data });
  });
  res.json(updated);
});

resumesRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.resume.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  await prisma.resume.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});
