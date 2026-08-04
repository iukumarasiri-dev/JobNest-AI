"use client";

import { useEffect, useState, use } from "react";

type GeneratedContent = {
  id: string;
  type: string;
  content: { coverLetter: string; keyPointsUsed: string[] };
  createdAt: string;
};

type Application = {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
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

  async function loadData() {
    const [appRes, genRes] = await Promise.all([
      fetch(`/api/applications/${id}`),
      fetch(`/api/applications/${id}/generated`),
    ]);
    setApplication(await appRes.json());
    const generated: GeneratedContent[] = await genRes.json();
    setCoverLetters(generated.filter((g) => g.type === "cover_letter"));
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const [appRes, genRes] = await Promise.all([
        fetch(`/api/applications/${id}`),
        fetch(`/api/applications/${id}/generated`),
      ]);
      const appData = await appRes.json();
      const generated: GeneratedContent[] = await genRes.json();
      if (!ignore) {
        setApplication(appData);
        setCoverLetters(generated.filter((g) => g.type === "cover_letter"));
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    const res = await fetch(`/api/applications/${id}/generate/cover-letter`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setGenerating(false);
      return;
    }
    await loadData();
    setGenerating(false);
  }

  if (!application) return <p>Loading...</p>;

  const latestLetter = coverLetters[0];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">{application.jobTitle}</h1>
      <p className="text-gray-500 mb-6">{application.companyName}</p>

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
