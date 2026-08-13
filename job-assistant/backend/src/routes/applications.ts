import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  listApplications,
  createApplication,
  getApplication,
  updateApplication,
  deleteApplication,
  listGeneratedContent,
} from "./applications/crud.js";
import { extractJob } from "./applications/extractJob.js";
import {
  generateCoverLetter,
  generateResumeBullets,
  generateSkillsMatch,
  generateInterviewQuestions,
} from "./applications/generate.js";

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);

applicationsRouter.get("/", listApplications);
applicationsRouter.post("/", createApplication);
applicationsRouter.post("/extract-job", extractJob);
applicationsRouter.get("/:id", getApplication);
applicationsRouter.put("/:id", updateApplication);
applicationsRouter.delete("/:id", deleteApplication);
applicationsRouter.get("/:id/generated", listGeneratedContent);

applicationsRouter.post("/:id/generate/cover-letter", generateCoverLetter);
applicationsRouter.post("/:id/generate/resume-bullets", generateResumeBullets);
applicationsRouter.post("/:id/generate/skills-match", generateSkillsMatch);
applicationsRouter.post("/:id/generate/interview-questions", generateInterviewQuestions);
