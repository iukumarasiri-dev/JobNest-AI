"use client";

import { use } from "react";
import { ApplicationInfoPanel } from "./_components/ApplicationInfoPanel";
import { CoverLetterSection } from "./_components/CoverLetterSection";
import { ResumeBulletsSection } from "./_components/ResumeBulletsSection";
import { SkillsMatchSection } from "./_components/SkillsMatchSection";
import { InterviewQuestionsSection } from "./_components/InterviewQuestionsSection";
import { useApplicationDetail } from "./useApplicationDetail";

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
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
  } = useApplicationDetail(id);

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

      <ApplicationInfoPanel
        application={application}
        savingStatus={savingStatus}
        statusError={statusError}
        onStatusChange={handleStatusChange}
        notesDraft={notesDraft}
        onNotesDraftChange={setNotesDraft}
        followUpDraft={followUpDraft}
        onFollowUpDraftChange={setFollowUpDraft}
        notesError={notesError}
        savingNotes={savingNotes}
        onSaveNotes={handleSaveNotes}
      />

      <CoverLetterSection
        latestLetter={latestLetter}
        generating={generating}
        error={error}
        copied={copied}
        onGenerate={handleGenerate}
        onCopy={handleCopy}
      />

      <ResumeBulletsSection
        latestBullets={latestBullets}
        generating={generatingBullets}
        error={bulletsError}
        copied={copiedBullets}
        onGenerate={handleGenerateBullets}
        onCopy={handleCopyBullets}
      />

      <SkillsMatchSection
        latestSkills={latestSkills}
        generating={generatingSkills}
        error={skillsError}
        onGenerate={handleGenerateSkills}
      />

      <InterviewQuestionsSection
        latestQuestions={latestQuestions}
        generating={generatingQuestions}
        error={questionsError}
        copied={copiedQuestions}
        onGenerate={handleGenerateQuestions}
        onCopy={handleCopyQuestions}
      />
    </div>
  );
}
