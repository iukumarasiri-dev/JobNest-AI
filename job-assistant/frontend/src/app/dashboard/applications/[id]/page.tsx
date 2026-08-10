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

type GeneratedContent = CoverLetterContent | ResumeBulletsContent | SkillsMatchContent;

const STATUS_OPTIONS = ["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"];

type Application = {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: string;
  notes: string | null;
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
  const [generating, setGenerating] = useState(false);
  const [generatingBullets, setGeneratingBullets] = useState(false);
  const [generatingSkills, setGeneratingSkills] = useState(false);
  const [error, setError] = useState("");
  const [bulletsError, setBulletsError] = useState("");
  const [skillsError, setSkillsError] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedBullets, setCopiedBullets] = useState(false);

  async function loadData() {
    const [appData, generated] = await Promise.all([
      apiFetch(`/api/applications/${id}`),
      apiFetch(`/api/applications/${id}/generated`) as Promise<GeneratedContent[]>,
    ]);
    setApplication(appData);
    setNotesDraft(appData.notes ?? "");
    setCoverLetters(generated.filter((g): g is CoverLetterContent => g.type === "cover_letter"));
    setBulletSets(generated.filter((g): g is ResumeBulletsContent => g.type === "resume_bullets"));
    setSkillsSets(generated.filter((g): g is SkillsMatchContent => g.type === "skills_analysis"));
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const [appData, generated] = await Promise.all([
        apiFetch(`/api/applications/${id}`),
        apiFetch(`/api/applications/${id}/generated`) as Promise<GeneratedContent[]>,
      ]);
      if (!ignore) {
        setApplication(appData);
        setNotesDraft(appData.notes ?? "");
        setCoverLetters(generated.filter((g): g is CoverLetterContent => g.type === "cover_letter"));
        setBulletSets(generated.filter((g): g is ResumeBulletsContent => g.type === "resume_bullets"));
        setSkillsSets(generated.filter((g): g is SkillsMatchContent => g.type === "skills_analysis"));
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleStatusChange(status: string) {
    setSavingStatus(true);
    await apiFetch(`/api/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    await loadData();
    setSavingStatus(false);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    await apiFetch(`/api/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify({ notes: notesDraft }),
    });
    await loadData();
    setSavingNotes(false);
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

  if (!application) return <p>Loading...</p>;

  const latestLetter = coverLetters[0];
  const latestBullets = bulletSets[0];
  const latestSkills = skillsSets[0];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">{application.jobTitle}</h1>
      <p className="text-gray-500 mb-6">{application.companyName}</p>

      <div className="border rounded p-4 mb-6 space-y-4">
        <div>
          <h2 className="font-semibold mb-2">Status</h2>
          <select
            className="border rounded p-2"
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
        </div>

        <div>
          <h2 className="font-semibold mb-2">Resume attached</h2>
          <p className="text-sm text-gray-700">
            {application.resume ? application.resume.title : "No resume attached"}
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Job description</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.jobDescription}</p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Notes</h2>
          <textarea
            className="w-full border rounded p-2 h-28 text-sm"
            placeholder="Add notes about this application..."
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-2 bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {savingNotes ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Cover Letter</h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
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
              className="text-sm border rounded px-3 py-1 mb-4 ml-2"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <div className="whitespace-pre-wrap text-sm border-t pt-4">
              {latestLetter.content.coverLetter}
            </div>
          </>
        )}
      </div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Resume Bullet Points</h2>

        {bulletsError && <p className="text-red-500 text-sm mb-2">{bulletsError}</p>}

        <button
          onClick={handleGenerateBullets}
          disabled={generatingBullets}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
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
              className="text-sm border rounded px-3 py-1 mb-4 ml-2"
            >
              {copiedBullets ? "Copied!" : "Copy"}
            </button>
            <ul className="list-disc list-inside text-sm border-t pt-4 space-y-1">
              {latestBullets.content.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Skills Match</h2>

        {skillsError && <p className="text-red-500 text-sm mb-2">{skillsError}</p>}

        <button
          onClick={handleGenerateSkills}
          disabled={generatingSkills}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
        >
          {generatingSkills
            ? "Generating..."
            : latestSkills
            ? "Regenerate Skills Match"
            : "Generate Skills Match"}
        </button>

        {latestSkills && (
          <div className="border-t pt-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Matched</h3>
              <div className="flex flex-wrap gap-2">
                {latestSkills.content.matched.map((skill, i) => (
                  <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
                {latestSkills.content.matched.length === 0 && (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Partial</h3>
              <div className="flex flex-wrap gap-2">
                {latestSkills.content.partial.map((skill, i) => (
                  <span key={i} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
                {latestSkills.content.partial.length === 0 && (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Missing</h3>
              <div className="flex flex-wrap gap-2">
                {latestSkills.content.missing.map((skill, i) => (
                  <span key={i} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
                {latestSkills.content.missing.length === 0 && (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
