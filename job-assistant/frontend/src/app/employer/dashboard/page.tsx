"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Post } from "@/features/feed/types";

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setPosts(await apiFetch("/api/posts/mine"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border rounded p-4 animate-pulse">
              <div className="h-3 w-20 bg-muted rounded mb-2" />
              <div className="h-6 w-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-4 text-sm">
          <p className="mb-2">{error}</p>
          <button onClick={load} className="underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const items = posts ?? [];
  const jobPosts = items.filter((p) => p.kind === "JOB");
  const totalApplicants = jobPosts.reduce((sum, p) => sum + (p.applicantCount ?? 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/employer/feed"
          className="text-sm bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90 transition-opacity"
        >
          + New post
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Posts</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-xs text-muted-foreground mb-1">Job Postings</p>
          <p className="text-2xl font-bold">{jobPosts.length}</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Applicants</p>
          <p className="text-2xl font-bold">{totalApplicants}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Your Job Postings</h2>
        {jobPosts.length === 0 ? (
          <div className="border border-border rounded p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">You haven&apos;t posted any jobs yet.</p>
            <Link
              href="/employer/feed"
              className="inline-block text-sm bg-primary text-primary-foreground rounded px-4 py-2 hover:opacity-90 transition-opacity"
            >
              Post a job
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {jobPosts.map((p) => (
              <div
                key={p.id}
                className="border border-border rounded p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.location || "Location not specified"}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                  {p.applicantCount ?? 0} applicant{p.applicantCount === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
