import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Application, Resume } from "./types";

export function useApplications() {
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

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    try {
      const created = await apiFetch("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          companyName,
          jobTitle,
          jobDescription,
          resumeId: resumeId || undefined,
          jobUrl: jobUrl || undefined,
        }),
      });
      const attachedResume = resumeId ? resumes.find((r) => r.id === resumeId) ?? null : null;
      setApplications((prev) => [{ ...created, resume: attachedResume }, ...prev]);
      setCompanyName("");
      setJobTitle("");
      setJobDescription("");
      setJobUrl("");
      setResumeId("");
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
    const previous = applications;
    setApplications((prev) => prev.filter((a) => a.id !== id));
    try {
      await apiFetch(`/api/applications/${id}`, { method: "DELETE" });
    } catch (err) {
      setApplications(previous);
      setActionError(err instanceof Error ? err.message : "Failed to delete application.");
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setSavingStatusId(id);
    setActionError("");
    const previous = applications;
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await apiFetch(`/api/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      setApplications(previous);
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

  return {
    applications,
    resumes,
    companyName,
    setCompanyName,
    jobTitle,
    setJobTitle,
    jobDescription,
    setJobDescription,
    jobUrl,
    setJobUrl,
    resumeId,
    setResumeId,
    loading,
    savingStatusId,
    pageLoading,
    loadError,
    formError,
    actionError,
    extracting,
    extractError,
    extractNotice,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortBy,
    setSortBy,
    loadAll,
    handleSubmit,
    handleExtract,
    handleDelete,
    handleStatusChange,
    hasActiveFilters,
    clearFilters,
    visibleApplications,
  };
}
