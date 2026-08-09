"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Application = {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: string;
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadApplications() {
    setApplications(await apiFetch("/api/applications"));
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const data = await apiFetch("/api/applications");
      if (!ignore) setApplications(data);
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
      body: JSON.stringify({ companyName, jobTitle, jobDescription }),
    });
    setCompanyName("");
    setJobTitle("");
    setJobDescription("");
    await loadApplications();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await apiFetch(`/api/applications/${id}`, { method: "DELETE" });
    await loadApplications();
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
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{a.status}</span>
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