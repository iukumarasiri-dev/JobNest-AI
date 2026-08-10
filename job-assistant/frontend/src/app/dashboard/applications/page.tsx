"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const STATUS_OPTIONS = ["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"];

type Application = {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: string;
  resume: { id: string; title: string } | null;
};

type Resume = {
  id: string;
  title: string;
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");

  async function loadAll() {
    setPageLoading(true);
    setLoadError("");
    try {
      const [applicationsData, resumesData] = await Promise.all([
        apiFetch("/api/applications"),
        apiFetch("/api/resumes"),
      ]);
      setApplications(applicationsData);
      setResumes(resumesData);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load applications.");
    } finally {
      setPageLoading(false);
    }
  }

  async function loadApplications() {
    setApplications(await apiFetch("/api/applications"));
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    try {
      await apiFetch("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          companyName,
          jobTitle,
          jobDescription,
          resumeId: resumeId || undefined,
        }),
      });
      setCompanyName("");
      setJobTitle("");
      setJobDescription("");
      setResumeId("");
      await loadApplications();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add application.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setActionError("");
    try {
      await apiFetch(`/api/applications/${id}`, { method: "DELETE" });
      await loadApplications();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete application.");
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setSavingStatusId(id);
    setActionError("");
    try {
      await apiFetch(`/api/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await loadApplications();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setSavingStatusId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Applications</h1>

      <form onSubmit={handleSubmit} className="space-y-3 mb-8 border border-border p-4 rounded-lg">
        <input
          className="w-full border border-border rounded p-2 bg-background"
          placeholder="Company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <input
          className="w-full border border-border rounded p-2 bg-background"
          placeholder="Job title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border border-border rounded p-2 h-40 bg-background"
          placeholder="Paste job description here"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          required
        />
        <select
          className="w-full border border-border rounded p-2 bg-background"
          value={resumeId}
          onChange={(e) => setResumeId(e.target.value)}
        >
          <option value="">No resume attached</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>

        {formError && (
          <p className="text-sm text-destructive">{formError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Application"}
        </button>
      </form>

      {actionError && (
        <p className="text-sm text-destructive mb-4">{actionError}</p>
      )}

      {pageLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border rounded p-4 animate-pulse">
              <div className="h-4 w-48 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
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

      {!pageLoading && !loadError && applications.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No applications yet. Fill out the form above to add your first one.
        </p>
      )}

      {!pageLoading && !loadError && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((a) => (
            <div
              key={a.id}
              className="border border-border rounded p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2"
            >
              <div>
                <h3 className="font-semibold">
                  <a href={`/dashboard/applications/${a.id}`} className="hover:underline">
                    {a.jobTitle} @ {a.companyName}
                  </a>
                </h3>
                <select
                  className="text-xs border border-border rounded px-2 py-1 bg-background"
                  value={a.status}
                  disabled={savingStatusId === a.id}
                  onChange={(e) => handleStatusChange(a.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {a.resume && (
                  <span className="text-xs text-muted-foreground ml-2">Resume: {a.resume.title}</span>
                )}
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="text-destructive text-sm self-start"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
