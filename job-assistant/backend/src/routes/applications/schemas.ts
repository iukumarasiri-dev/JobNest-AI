import { z } from "zod";

export const applicationSchema = z.object({
  companyName: z.string().min(1),
  jobTitle: z.string().min(1),
  jobDescription: z.string().min(1),
  resumeId: z.string().optional(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  jobUrl: z.string().optional(),
});

export const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  jobTitle: z.string().min(1).optional(),
  jobDescription: z.string().min(1).optional(),
  status: z.enum(["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"]).optional(),
  notes: z.string().optional(),
  appliedDate: z.string().datetime().optional(),
  followUpDate: z.string().nullable().optional(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  jobUrl: z.string().optional(),
});

export const extractJobSchema = z.object({ url: z.string().url() });
