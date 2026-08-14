import { z } from "zod";

const HTTP_URL = /^https?:\/\//;
const VIDEO_DATA_URL = /^data:video\/(mp4|webm|ogg|quicktime);base64,/;
const MAX_VIDEO_DATA_URL_LENGTH = 17_000_000; // ~12MB raw file, base64-inflated, with margin

const videoUrlSchema = z
  .string()
  .max(MAX_VIDEO_DATA_URL_LENGTH)
  .refine((val) => HTTP_URL.test(val) || VIDEO_DATA_URL.test(val), {
    message: "Must be a video link or an uploaded video file",
  })
  .optional()
  .or(z.literal(""));

const ATTACHMENT_DATA_URL =
  /^data:(image\/(png|jpe?g|gif|webp)|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document);base64,/;
const MAX_ATTACHMENT_DATA_URL_LENGTH = 14_000_000; // ~10MB raw file, base64-inflated, with margin

const attachmentUrlSchema = z
  .string()
  .max(MAX_ATTACHMENT_DATA_URL_LENGTH)
  .refine((val) => ATTACHMENT_DATA_URL.test(val), {
    message: "Must be an uploaded image, PDF, or Word document",
  })
  .optional()
  .or(z.literal(""));

const attachmentNameSchema = z.string().max(200).optional().or(z.literal(""));

const textPostSchema = z.object({
  kind: z.literal("TEXT"),
  body: z.string().min(1),
  videoUrl: videoUrlSchema,
  attachmentUrl: attachmentUrlSchema,
  attachmentName: attachmentNameSchema,
});

const jobPostSchema = z.object({
  kind: z.literal("JOB"),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  videoUrl: videoUrlSchema,
  attachmentUrl: attachmentUrlSchema,
  attachmentName: attachmentNameSchema,
});

export const createPostSchema = z.discriminatedUnion("kind", [textPostSchema, jobPostSchema]);

export const commentSchema = z.object({
  body: z.string().min(1),
});

export const applySchema = z.object({
  resumeId: z.string().optional(),
});
