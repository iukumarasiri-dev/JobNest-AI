import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type {
  Application,
  CoverLetterContent,
  GeneratedContent,
  InterviewQuestionsContent,
  ResumeBulletsContent,
  SkillsMatchContent,
} from "./types";

export function useApplicationDetail(id: string) {
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

  return {
    application,
    coverLetters,
    bulletSets,
    skillsSets,
    interviewQuestionSets,
    pageLoading,
    loadError,
    loadInitial,
    generating,
    generatingBullets,
    generatingSkills,
    generatingQuestions,
    error,
    bulletsError,
    skillsError,
    questionsError,
    notesDraft,
    setNotesDraft,
    followUpDraft,
    setFollowUpDraft,
    savingNotes,
    notesError,
    savingStatus,
    statusError,
    copied,
    copiedBullets,
    copiedQuestions,
    handleStatusChange,
    handleSaveNotes,
    handleGenerate,
    handleCopy,
    handleGenerateBullets,
    handleCopyBullets,
    handleGenerateSkills,
    handleGenerateQuestions,
    handleCopyQuestions,
  };
}
