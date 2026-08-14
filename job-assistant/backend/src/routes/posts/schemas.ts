import { z } from "zod";

const textPostSchema = z.object({
  kind: z.literal("TEXT"),
  body: z.string().min(1),
  videoUrl: z.url().optional().or(z.literal("")),
});

const jobPostSchema = z.object({
  kind: z.literal("JOB"),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  videoUrl: z.url().optional().or(z.literal("")),
});

export const createPostSchema = z.discriminatedUnion("kind", [textPostSchema, jobPostSchema]);

export const commentSchema = z.object({
  body: z.string().min(1),
});

export const applySchema = z.object({
  resumeId: z.string().optional(),
});
