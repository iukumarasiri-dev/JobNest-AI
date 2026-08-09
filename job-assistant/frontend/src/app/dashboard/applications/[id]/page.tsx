"use client";

import { useEffect, useState, use } from "react";
import { apiFetch } from "@/lib/api";

type GeneratedContent = {
  id: string;
  type: string;
  content: { coverLetter: string; keyPointsUsed: string[] };
  createdAt: string;
};

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
  const [coverLetters, setCoverLetters] = useState<GeneratedContent[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  async function loadData() {
    const [appData, generated] = await Promise.all([
      apiFetch(`/api/applications/${id}`),
      apiFetch(`/api/applications/${id}/generated`) as Promise<GeneratedContent[]>,
    ]);
    setApplication(appData);
    setNotesDraft(appData.notes ?? "");
    setCoverLetters(generated.filter((g) => g.type === "cover_letter"));
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
        setCoverLetters(generated.filter((g) => g.type === "cover_letter"));
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

  if (!application) return <p>Loading...</p>;

  const latestLetter = coverLetters[0];

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
          <div className="whitespace-pre-wrap text-sm border-t pt-4">
            {latestLetter.content.coverLetter}
          </div>
        )}
      </div>
    </div>
  );
}
