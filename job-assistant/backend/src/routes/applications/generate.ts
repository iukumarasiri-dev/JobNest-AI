import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import { groq } from "../../lib/ai/client.js";
import { buildCoverLetterPrompt } from "../../lib/ai/prompts/coverLetter.js";
import { buildResumeBulletsPrompt } from "../../lib/ai/prompts/resumeBullets.js";
import { buildSkillsMatchPrompt } from "../../lib/ai/prompts/skillsMatch.js";
import { buildInterviewQuestionsPrompt } from "../../lib/ai/prompts/interviewQuestions.js";

const MODEL = "llama-3.3-70b-versatile";

async function loadApplicationWithResume(id: string, userId: string) {
  return prisma.application.findFirst({
    where: { id, userId },
    include: { resume: true },
  });
}

type ApplicationWithResume = NonNullable<Awaited<ReturnType<typeof loadApplicationWithResume>>>;

async function completeJson<T>(prompt: string, temperature: number, validate: (data: T) => boolean) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from model");

  const parsed = JSON.parse(raw) as T;
  if (!validate(parsed)) {
    throw new Error("Malformed response from model");
  }
  return parsed;
}

function promptContext(application: ApplicationWithResume) {
  return {
    jobTitle: application.jobTitle,
    companyName: application.companyName,
    jobDescription: application.jobDescription,
    resumeText: application.resume!.rawText!,
  };
}

export async function generateCoverLetter(req: Request, res: Response) {
  const application = await loadApplicationWithResume(req.params.id, req.user!.id);
  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }
  if (!application.resume?.rawText) {
    return res.status(400).json({ error: "This application has no resume attached. Attach a resume first." });
  }

  const prompt = buildCoverLetterPrompt(promptContext(application));

  let parsed: { coverLetter: string; keyPointsUsed: string[] };
  try {
    parsed = await completeJson(
      prompt,
      0.7,
      (data: { coverLetter: string; keyPointsUsed: string[] }) =>
        !!data.coverLetter && typeof data.coverLetter === "string"
    );
  } catch (err) {
    console.error("Cover letter generation failed:", err);
    return res.status(502).json({ error: "Failed to generate cover letter. Please try again." });
  }

  const saved = await prisma.generatedContent.create({
    data: {
      applicationId: application.id,
      type: "cover_letter",
      content: parsed,
      modelUsed: MODEL,
      promptVersion: "v1",
    },
  });

  res.status(201).json(saved);
}

export async function generateResumeBullets(req: Request, res: Response) {
  const application = await loadApplicationWithResume(req.params.id, req.user!.id);
  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }
  if (!application.resume?.rawText) {
    return res.status(400).json({ error: "This application has no resume attached. Attach a resume first." });
  }

  const prompt = buildResumeBulletsPrompt(promptContext(application));

  let parsed: { bullets: string[] };
  try {
    parsed = await completeJson(
      prompt,
      0.7,
      (data: { bullets: string[] }) => Array.isArray(data.bullets) && data.bullets.length > 0
    );
  } catch (err) {
    console.error("Resume bullets generation failed:", err);
    return res.status(502).json({ error: "Failed to generate resume bullets. Please try again." });
  }

  const saved = await prisma.generatedContent.create({
    data: {
      applicationId: application.id,
      type: "resume_bullets",
      content: parsed,
      modelUsed: MODEL,
      promptVersion: "v1",
    },
  });

  res.status(201).json(saved);
}

export async function generateSkillsMatch(req: Request, res: Response) {
  const application = await loadApplicationWithResume(req.params.id, req.user!.id);
  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }
  if (!application.resume?.rawText) {
    return res.status(400).json({ error: "This application has no resume attached. Attach a resume first." });
  }

  const prompt = buildSkillsMatchPrompt(promptContext(application));

  let parsed: { matched: string[]; partial: string[]; missing: string[] };
  try {
    parsed = await completeJson(
      prompt,
      0.7,
      (data: { matched: string[]; partial: string[]; missing: string[] }) =>
        Array.isArray(data.matched) && Array.isArray(data.partial) && Array.isArray(data.missing)
    );
  } catch (err) {
    console.error("Skills match generation failed:", err);
    return res.status(502).json({ error: "Failed to generate skills match. Please try again." });
  }

  const saved = await prisma.generatedContent.create({
    data: {
      applicationId: application.id,
      type: "skills_analysis",
      content: parsed,
      modelUsed: MODEL,
      promptVersion: "v1",
    },
  });

  res.status(201).json(saved);
}

export async function generateInterviewQuestions(req: Request, res: Response) {
  const application = await loadApplicationWithResume(req.params.id, req.user!.id);
  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }
  if (!application.resume?.rawText) {
    return res.status(400).json({ error: "This application has no resume attached. Attach a resume first." });
  }

  const prompt = buildInterviewQuestionsPrompt(promptContext(application));

  let parsed: { questions: { question: string; tip: string }[] };
  try {
    parsed = await completeJson(
      prompt,
      0.7,
      (data: { questions: { question: string; tip: string }[] }) =>
        Array.isArray(data.questions) && data.questions.length > 0
    );
  } catch (err) {
    console.error("Interview questions generation failed:", err);
    return res.status(502).json({ error: "Failed to generate interview questions. Please try again." });
  }

  const saved = await prisma.generatedContent.create({
    data: {
      applicationId: application.id,
      type: "interview_questions",
      content: parsed,
      modelUsed: MODEL,
      promptVersion: "v1",
    },
  });

  res.status(201).json(saved);
}
