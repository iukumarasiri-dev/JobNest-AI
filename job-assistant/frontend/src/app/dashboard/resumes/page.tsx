"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Resume = { id: string; title: string; rawText: string | null; isPrimary: boolean };

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadResumes() {
    setResumes(await apiFetch("/api/resumes"));
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const data = await apiFetch("/api/resumes");
      if (!ignore) setResumes(data);
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await apiFetch("/api/resumes", {
      method: "POST",
      body: JSON.stringify({ title, rawText }),
    });
    setTitle("");
    setRawText("");
    await loadResumes();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await apiFetch(`/api/resumes/${id}`, { method: "DELETE" });
    await loadResumes();
  }

  async function handleMarkPrimary(id: string) {
    await apiFetch(`/api/resumes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isPrimary: true }),
    });
    await loadResumes();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Resumes</h1>

      <form onSubmit={handleSubmit} className="space-y-3 mb-8 border p-4 rounded-lg">
        <input
          className="w-full border rounded p-2"
          placeholder="Resume title (e.g. Software Engineer - Main)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border rounded p-2 h-40"
          placeholder="Paste resume text here"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Resume"}
        </button>
      </form>

      <div className="space-y-3">
        {resumes.map((r) => (
          <div key={r.id} className="border rounded p-4 flex justify-between items-start">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {r.title}
                {r.isPrimary && (
                  <span className="text-xs bg-black text-white px-2 py-0.5 rounded">Primary</span>
                )}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">{r.rawText}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!r.isPrimary && (
                <button
                  onClick={() => handleMarkPrimary(r.id)}
                  className="text-sm text-blue-600"
                >
                  Mark primary
                </button>
              )}
              <button onClick={() => handleDelete(r.id)} className="text-red-500 text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}