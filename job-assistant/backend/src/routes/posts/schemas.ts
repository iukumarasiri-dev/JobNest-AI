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

const textPostSchema = z.object({
  kind: z.literal("TEXT"),
  body: z.string().min(1),
  videoUrl: videoUrlSchema,
});

const jobPostSchema = z.object({
  kind: z.literal("JOB"),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  videoUrl: videoUrlSchema,
});

export const createPostSchema = z.discriminatedUnion("kind", [textPostSchema, jobPostSchema]);

export const commentSchema = z.object({
  body: z.string().min(1),
});

export const applySchema = z.object({
  resumeId: z.string().optional(),
});
