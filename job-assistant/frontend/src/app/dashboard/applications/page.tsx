"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

const STATUS_OPTIONS = ["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"];

type Application = {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: string;
  createdAt: string;
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
  const [jobUrl, setJobUrl] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [extractNotice, setExtractNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("newest");

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
          jobUrl: jobUrl || undefined,
        }),
      });
      setCompanyName("");
      setJobTitle("");
      setJobDescription("");
      setJobUrl("");
      setResumeId("");
      await loadApplications();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add application.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExtract() {
    if (!jobUrl.trim()) {
      setExtractError("Paste a job posting URL first.");
      return;
    }
    setExtracting(true);
    setExtractError("");
    setExtractNotice("");
    try {
      const data = await apiFetch("/api/applications/extract-job", {
        method: "POST",
        body: JSON.stringify({ url: jobUrl.trim() }),
      });
      if (data.jobTitle) setJobTitle(data.jobTitle);
      if (data.companyName) setCompanyName(data.companyName);
      if (data.jobDescription) setJobDescription(data.jobDescription);
      setExtractNotice("Filled in from the job posting. Review the fields below before saving.");
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Failed to fetch this job posting.");
    } finally {
      setExtracting(false);
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

  const hasActiveFilters = Boolean(search || statusFilter || dateFrom || dateTo);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  }

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const filtered = applications.filter((a) => {
      if (query) {
        const haystack = `${a.companyName} ${a.jobTitle}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (statusFilter && a.status !== statusFilter) return false;
      const created = new Date(a.createdAt);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "company":
          return a.companyName.localeCompare(b.companyName);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [applications, search, statusFilter, dateFrom, dateTo, sortBy]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Applications</h1>

      <form onSubmit={handleSubmit} className="space-y-3 mb-8 border border-border p-4 rounded-lg">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Job posting URL (optional)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 border border-border rounded p-2 bg-background"
              placeholder="https://company.com/careers/job-123"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              type="url"
            />
            <button
              type="button"
              onClick={handleExtract}
              disabled={extracting}
              className="border border-border rounded px-4 py-2 text-sm disabled:opacity-50 whitespace-nowrap"
            >
              {extracting ? "Fetching..." : "Fetch from URL"}
            </button>
          </div>
          {extractError && <p className="text-sm text-destructive mt-1">{extractError}</p>}
          {extractNotice && !extractError && (
            <p className="text-sm text-muted-foreground mt-1">{extractNotice}</p>
          )}
        </div>
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
        <div className="mb-4 border border-border rounded-lg p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 border border-border rounded p-2 bg-background text-sm"
              placeholder="Search by company or job title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="border border-border rounded p-2 bg-background text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="border border-border rounded p-2 bg-background text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="company">Company (A-Z)</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              From
              <input
                type="date"
                className="border border-border rounded p-2 bg-background text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              To
              <input
                type="date"
                className="border border-border rounded p-2 bg-background text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm underline text-muted-foreground self-start sm:self-auto"
              >
                Clear filters
              </button>
            )}
            <span className="text-xs text-muted-foreground sm:ml-auto">
              Showing {visibleApplications.length} of {applications.length}
            </span>
          </div>
        </div>
      )}

      {!pageLoading && !loadError && applications.length > 0 && visibleApplications.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No applications match your filters.{" "}
          <button type="button" onClick={clearFilters} className="underline">
            Clear filters
          </button>
        </p>
      )}

      {!pageLoading && !loadError && visibleApplications.length > 0 && (
        <div className="space-y-3">
          {visibleApplications.map((a) => (
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
