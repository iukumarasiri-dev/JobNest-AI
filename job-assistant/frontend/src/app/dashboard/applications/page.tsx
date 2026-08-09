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

  async function loadApplications() {
    setApplications(await apiFetch("/api/applications"));
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const [applicationsData, resumesData] = await Promise.all([
        apiFetch("/api/applications"),
        apiFetch("/api/resumes"),
      ]);
      if (!ignore) {
        setApplications(applicationsData);
        setResumes(resumesData);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
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
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await apiFetch(`/api/applications/${id}`, { method: "DELETE" });
    await loadApplications();
  }

  async function handleStatusChange(id: string, status: string) {
    setSavingStatusId(id);
    await apiFetch(`/api/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    await loadApplications();
    setSavingStatusId(null);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Applications</h1>

      <form onSubmit={handleSubmit} className="space-y-3 mb-8 border p-4 rounded-lg">
        <input
          className="w-full border rounded p-2"
          placeholder="Company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Job title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border rounded p-2 h-40"
          placeholder="Paste job description here"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          required
        />
        <select
          className="w-full border rounded p-2"
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
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Application"}
        </button>
      </form>

      <div className="space-y-3">
        {applications.map((a) => (
          <div key={a.id} className="border rounded p-4 flex justify-between items-start">
            <div>
              <h3 className="font-semibold">
                <a href={`/dashboard/applications/${a.id}`} className="hover:underline">
                  {a.jobTitle} @ {a.companyName}
                </a>
              </h3>
              <select
                className="text-xs border rounded px-2 py-1"
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
                <span className="text-xs text-gray-500 ml-2">Resume: {a.resume.title}</span>
              )}
            </div>
            <button onClick={() => handleDelete(a.id)} className="text-red-500 text-sm">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}