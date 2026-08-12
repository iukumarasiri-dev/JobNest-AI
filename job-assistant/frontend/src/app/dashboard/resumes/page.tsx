"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, apiUpload } from "@/lib/api";

type Resume = { id: string; title: string; rawText: string | null; isPrimary: boolean };

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAll() {
    setPageLoading(true);
    setLoadError("");
    try {
      setResumes(await apiFetch("/api/resumes"));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load resumes.");
    } finally {
      setPageLoading(false);
    }
  }

  async function loadResumes() {
    setResumes(await apiFetch("/api/resumes"));
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    try {
      await apiFetch("/api/resumes", {
        method: "POST",
        body: JSON.stringify({ title, rawText }),
      });
      setTitle("");
      setRawText("");
      await loadResumes();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add resume.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (uploadTitle.trim()) formData.append("title", uploadTitle.trim());
      await apiUpload("/api/resumes/upload", formData);
      setUploadTitle("");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadResumes();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setActionError("");
    try {
      await apiFetch(`/api/resumes/${id}`, { method: "DELETE" });
      await loadResumes();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete resume.");
    }
  }

  async function handleMarkPrimary(id: string) {
    setActionError("");
    try {
      await apiFetch(`/api/resumes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isPrimary: true }),
      });
      await loadResumes();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to mark resume as primary.");
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Resumes</h1>

      <form onSubmit={handleSubmit} className="space-y-3 mb-8 border border-border p-4 rounded-lg">
        <input
          className="w-full border border-border rounded p-2 bg-background"
          placeholder="Resume title (e.g. Software Engineer - Main)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border border-border rounded p-2 h-40 bg-background"
          placeholder="Paste resume text here"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          required
        />

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Resume"}
        </button>
      </form>

      <form onSubmit={handleUpload} className="space-y-3 mb-8 border border-border p-4 rounded-lg">
        <h2 className="font-semibold text-sm">Or upload a resume file (PDF or DOCX)</h2>
        <input
          className="w-full border border-border rounded p-2 bg-background"
          placeholder="Resume title (defaults to file name)"
          value={uploadTitle}
          onChange={(e) => setUploadTitle(e.target.value)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />

        {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

        <button
          type="submit"
          disabled={uploading || !uploadFile}
          className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Resume"}
        </button>
      </form>

      {actionError && <p className="text-sm text-destructive mb-4">{actionError}</p>}

      {pageLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border rounded p-4 animate-pulse">
              <div className="h-4 w-40 bg-muted rounded mb-2" />
              <div className="h-3 w-64 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {!pageLoading && loadError && (
        <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-4 text-sm">
          <p className="mb-2">{loadError}</p>
          <button onClick={loadAll} className="underline">
            Try again
          </button>
        </div>
      )}

      {!pageLoading && !loadError && resumes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No resumes yet. Fill out the form above to add your first one.
        </p>
      )}

      {!pageLoading && !loadError && resumes.length > 0 && (
        <div className="space-y-3">
          {resumes.map((r) => (
            <div
              key={r.id}
              className="border border-border rounded p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2"
            >
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {r.title}
                  {r.isPrimary && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{r.rawText}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {!r.isPrimary && (
                  <button onClick={() => handleMarkPrimary(r.id)} className="text-sm text-blue-600 dark:text-blue-400">
                    Mark primary
                  </button>
                )}
                <button onClick={() => handleDelete(r.id)} className="text-destructive text-sm">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
