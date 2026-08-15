export type CoverLetterContent = {
  id: string;
  type: "cover_letter";
  content: { coverLetter: string; keyPointsUsed: string[] };
  createdAt: string;
};

export type ResumeBulletsContent = {
  id: string;
  type: "resume_bullets";
  content: { bullets: string[] };
  createdAt: string;
};

export type SkillsMatchContent = {
  id: string;
  type: "skills_analysis";
  content: { matched: string[]; partial: string[]; missing: string[] };
  createdAt: string;
};

export type InterviewQuestionsContent = {
  id: string;
  type: "interview_questions";
  content: { questions: { question: string; tip: string }[] };
  createdAt: string;
};

export type GeneratedContent =
  | CoverLetterContent
  | ResumeBulletsContent
  | SkillsMatchContent
  | InterviewQuestionsContent;

export const STATUS_OPTIONS = ["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"];

export type Application = {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: string;
  notes: string | null;
  followUpDate: string | null;
  resume: { title: string } | null;
};
