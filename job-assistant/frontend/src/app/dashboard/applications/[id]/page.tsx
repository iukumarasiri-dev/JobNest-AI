"use client";

import { useEffect, useState, use } from "react";
import { apiFetch } from "@/lib/api";

type CoverLetterContent = {
  id: string;
  type: "cover_letter";
  content: { coverLetter: string; keyPointsUsed: string[] };
  createdAt: string;
};

type ResumeBulletsContent = {
  id: string;
  type: "resume_bullets";
  content: { bullets: string[] };
  createdAt: string;
};

type SkillsMatchContent = {
  id: string;
  type: "skills_analysis";
  content: { matched: string[]; partial: string[]; missing: string[] };
  createdAt: string;
};

type InterviewQuestionsContent = {
  id: string;
  type: "interview_questions";
  content: { questions: { question: string; tip: string }[] };
  createdAt: string;
};

type GeneratedContent =
  | CoverLetterContent
  | ResumeBulletsContent
  | SkillsMatchContent
  | InterviewQuestionsContent;

const STATUS_OPTIONS = ["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"];

type Application = {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: string;
  notes: string | null;
  followUpDate: string | null;
  resume: { title: string } | null;
};

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [application, setApplication] = useState<Application | null>(null);
  const [coverLetters, setCoverLetters] = useState<CoverLetterContent[]>([]);
  const [bulletSets, setBulletSets] = useState<ResumeBulletsContent[]>([]);
  const [skillsSets, setSkillsSets] = useState<SkillsMatchContent[]>([]);
  const [interviewQuestionSets, setInterviewQuestionSets] = useState<InterviewQuestionsContent[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingBullets, setGeneratingBullets] = useState(false);
  const [generatingSkills, setGeneratingSkills] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [error, setError] = useState("");
  const [bulletsError, setBulletsError] = useState("");
  const [skillsError, setSkillsError] = useState("");
  const [questionsError, setQuestionsError] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedBullets, setCopiedBullets] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  async function loadData() {
    const [appData, generated] = await Promise.all([
      apiFetch(`/api/applications/${id}`),
      apiFetch(`/api/applications/${id}/generated`) as Promise<GeneratedContent[]>,
    ]);
    setApplication(appData);
    setNotesDraft(appData.notes ?? "");
    setFollowUpDraft(appData.followUpDate ? appData.followUpDate.slice(0, 10) : "");
    setCoverLetters(generated.filter((g): g is CoverLetterContent => g.type === "cover_letter"));
    setBulletSets(generated.filter((g): g is ResumeBulletsContent => g.type === "resume_bullets"));
    setSkillsSets(generated.filter((g): g is SkillsMatchContent => g.type === "skills_analysis"));
    setInterviewQuestionSets(
      generated.filter((g): g is InterviewQuestionsContent => g.type === "interview_questions")
    );
  }

  async function loadInitial() {
    setPageLoading(true);
    setLoadError("");
    try {
      await loadData();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load this application.");
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusChange(status: string) {
    setSavingStatus(true);
    setStatusError("");
    try {
      await apiFetch(`/api/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    setNotesError("");
    try {
      await apiFetch(`/api/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ notes: notesDraft, followUpDate: followUpDraft || null }),
      });
      await loadData();
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : "Failed to save notes.");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      await apiFetch(`/api/applications/${id}/generate/cover-letter`, { method: "POST" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerateBullets() {
    setGeneratingBullets(true);
    setBulletsError("");
    try {
      await apiFetch(`/api/applications/${id}/generate/resume-bullets`, { method: "POST" });
      await loadData();
    } catch (err) {
      setBulletsError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGeneratingBullets(false);
    }
  }

  async function handleCopyBullets(bullets: string[]) {
    await navigator.clipboard.writeText(bullets.map((b) => `- ${b}`).join("\n"));
    setCopiedBullets(true);
    setTimeout(() => setCopiedBullets(false), 2000);
  }

  async function handleGenerateSkills() {
    setGeneratingSkills(true);
    setSkillsError("");
    try {
      await apiFetch(`/api/applications/${id}/generate/skills-match`, { method: "POST" });
      await loadData();
    } catch (err) {
      setSkillsError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGeneratingSkills(false);
    }
  }

  async function handleGenerateQuestions() {
    setGeneratingQuestions(true);
    setQuestionsError("");
    try {
      await apiFetch(`/api/applications/${id}/generate/interview-questions`, { method: "POST" });
      await loadData();
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGeneratingQuestions(false);
    }
  }

  async function handleCopyQuestions(questions: { question: string; tip: string }[]) {
    await navigator.clipboard.writeText(
      questions.map((q) => `Q: ${q.question}\nTip: ${q.tip}`).join("\n\n")
    );
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 2000);
  }

  if (pageLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-7 w-64 bg-muted rounded animate-pulse" />
        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
        <div className="border border-border rounded p-4 space-y-3 animate-pulse">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl">
        <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-4 text-sm">
          <p className="mb-2">{loadError}</p>
          <button onClick={loadInitial} className="underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const latestLetter = coverLetters[0];
  const latestBullets = bulletSets[0];
  const latestSkills = skillsSets[0];
  const latestQuestions = interviewQuestionSets[0];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">{application.jobTitle}</h1>
      <p className="text-muted-foreground mb-6">{application.companyName}</p>

      <div className="border border-border rounded p-4 mb-6 space-y-4">
        <div>
          <h2 className="font-semibold mb-2">Status</h2>
          <select
            className="border border-border rounded p-2 bg-background"
            value={application.status}
            disabled={savingStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {statusError && <p className="text-sm text-destructive mt-2">{statusError}</p>}
        </div>

        <div>
          <h2 className="font-semibold mb-2">Resume attached</h2>
          <p className="text-sm text-foreground">
            {application.resume ? application.resume.title : "No resume attached"}
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Job description</h2>
          <p className="text-sm text-foreground whitespace-pre-wrap">{application.jobDescription}</p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Notes</h2>
          <textarea
            className="w-full border border-border rounded p-2 h-28 text-sm bg-background"
            placeholder="Add notes about this application..."
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
          />
        </div>

        <div>
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            Follow-up date
            {followUpDraft && new Date(followUpDraft) < new Date(new Date().toDateString()) && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                Overdue
              </span>
            )}
          </h2>
          <input
            type="date"
            className="border border-border rounded p-2 text-sm bg-background"
            value={followUpDraft}
            onChange={(e) => setFollowUpDraft(e.target.value)}
          />
        </div>

        {notesError && <p className="text-sm text-destructive">{notesError}</p>}

        <button
          onClick={handleSaveNotes}
          disabled={savingNotes}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {savingNotes ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="border border-border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Cover Letter</h2>

        {error && <p className="text-sm text-destructive mb-2">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
        >
          {generating
            ? "Generating..."
            : latestLetter
            ? "Regenerate Cover Letter"
            : "Generate Cover Letter"}
        </button>

        {latestLetter && (
          <>
            <button
              onClick={() => handleCopy(latestLetter.content.coverLetter)}
              className="text-sm border border-border rounded px-3 py-1 mb-4 ml-2"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <div className="whitespace-pre-wrap text-sm border-t border-border pt-4">
              {latestLetter.content.coverLetter}
            </div>
          </>
        )}
      </div>

      <div className="border border-border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Resume Bullet Points</h2>

        {bulletsError && <p className="text-sm text-destructive mb-2">{bulletsError}</p>}

        <button
          onClick={handleGenerateBullets}
          disabled={generatingBullets}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
        >
          {generatingBullets
            ? "Generating..."
            : latestBullets
            ? "Regenerate Bullet Points"
            : "Generate Bullet Points"}
        </button>

        {latestBullets && (
          <>
            <button
              onClick={() => handleCopyBullets(latestBullets.content.bullets)}
              className="text-sm border border-border rounded px-3 py-1 mb-4 ml-2"
            >
              {copiedBullets ? "Copied!" : "Copy"}
            </button>
            <ul className="list-disc list-inside text-sm border-t border-border pt-4 space-y-1">
              {latestBullets.content.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="border border-border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Skills Match</h2>

        {skillsError && <p className="text-sm text-destructive mb-2">{skillsError}</p>}

        <button
          onClick={handleGenerateSkills}
          disabled={generatingSkills}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
        >
          {generatingSkills
            ? "Generating..."
            : latestSkills
            ? "Regenerate Skills Match"
            : "Generate Skills Match"}
        </button>

        {latestSkills && (
          <div className="border-t border-border pt-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Matched</h3>
              <div className="flex flex-wrap gap-2">
                {latestSkills.content.matched.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-2 py-1 rounded"
                  >
                    {skill}
                  </span>
                ))}
                {latestSkills.content.matched.length === 0 && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Partial</h3>
              <div className="flex flex-wrap gap-2">
                {latestSkills.content.partial.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded"
                  >
                    {skill}
                  </span>
                ))}
                {latestSkills.content.partial.length === 0 && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Missing</h3>
              <div className="flex flex-wrap gap-2">
                {latestSkills.content.missing.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 px-2 py-1 rounded"
                  >
                    {skill}
                  </span>
                ))}
                {latestSkills.content.missing.length === 0 && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border border-border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Interview Questions</h2>

        {questionsError && <p className="text-sm text-destructive mb-2">{questionsError}</p>}

        <button
          onClick={handleGenerateQuestions}
          disabled={generatingQuestions}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
        >
          {generatingQuestions
            ? "Generating..."
            : latestQuestions
            ? "Regenerate Interview Questions"
            : "Generate Interview Questions"}
        </button>

        {latestQuestions && (
          <>
            <button
              onClick={() => handleCopyQuestions(latestQuestions.content.questions)}
              className="text-sm border border-border rounded px-3 py-1 mb-4 ml-2"
            >
              {copiedQuestions ? "Copied!" : "Copy"}
            </button>
            <ul className="text-sm border-t border-border pt-4 space-y-4">
              {latestQuestions.content.questions.map((q, i) => (
                <li key={i}>
                  <p className="font-medium">{q.question}</p>
                  <p className="text-muted-foreground mt-1">{q.tip}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
