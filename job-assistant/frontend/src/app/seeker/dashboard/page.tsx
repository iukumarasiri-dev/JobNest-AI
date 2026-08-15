"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { STATUS_OPTIONS, STATUS_COLORS } from "@/lib/status";

type Application = {
  id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  createdAt: string;
  followUpDate: string | null;
};

function followUpLabel(dueDate: Date, today: Date) {
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`, tone: "overdue" as const };
  }
  if (diffDays === 0) return { text: "Due today", tone: "today" as const };
  if (diffDays === 1) return { text: "Due tomorrow", tone: "soon" as const };
  return { text: `Due in ${diffDays} days`, tone: "soon" as const };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [resumeCount, setResumeCount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [apps, resumes] = await Promise.all([
        apiFetch("/api/applications"),
        apiFetch("/api/resumes"),
      ]);
      setApplications(apps);
      setResumeCount(resumes.length);
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

  const apps = applications ?? [];
  const total = apps.length;
  const countByStatus = Object.fromEntries(
    STATUS_OPTIONS.map((s) => [s, apps.filter((a) => a.status === s).length])
  );

  // "Responded" = employer gave any signal beyond silence: interview, offer, or rejected.
  const responded = countByStatus.interview + countByStatus.offer + countByStatus.rejected;
  const submitted = total - countByStatus.wishlist;
  const responseRate = submitted > 0 ? Math.round((responded / submitted) * 100) : null;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const addedThisWeek = apps.filter((a) => new Date(a.createdAt) >= sevenDaysAgo).length;
  const addedThisMonth = apps.filter((a) => new Date(a.createdAt) >= thirtyDaysAgo).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const withinSevenDays = new Date(today);
  withinSevenDays.setDate(withinSevenDays.getDate() + 7);

  const upcomingFollowUps = apps
    .filter((a) => a.followUpDate && a.status !== "rejected" && a.status !== "withdrawn")
    .map((a) => {
      const dueDate = new Date(a.followUpDate as string);
      dueDate.setHours(0, 0, 0, 0);
      return { ...a, dueDate };
    })
    .filter((a) => a.dueDate <= withinSevenDays)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const recentApplications = apps.slice(0, 6);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          {resumeCount === 0 && (
            <Link
              href="/seeker/resumes"
              className="text-sm border border-border rounded px-3 py-1.5 hover:bg-muted transition-colors"
            >
              Add Resume
            </Link>
          )}
          <Link
            href="/seeker/applications"
            className="text-sm bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            + Add Application
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Applications</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-xs text-muted-foreground mb-1">Response Rate</p>
          <p className="text-2xl font-bold">{responseRate === null ? "—" : `${responseRate}%`}</p>
          <p className="text-xs text-muted-foreground mt-1">of submitted apps with a reply</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-xs text-muted-foreground mb-1">Added This Week</p>
          <p className="text-2xl font-bold">{addedThisWeek}</p>
          <p className="text-xs text-muted-foreground mt-1">{addedThisMonth} in the last 30 days</p>
        </div>
      </div>

      {total > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Status Breakdown</h2>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {STATUS_OPTIONS.filter((s) => countByStatus[s] > 0).map((s) => (
              <div
                key={s}
                className={STATUS_COLORS[s].dot}
                style={{ width: `${(countByStatus[s] / total) * 100}%` }}
                title={`${s}: ${countByStatus[s]}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {STATUS_OPTIONS.map((s) => (
              <span
                key={s}
                className={`text-xs px-2 py-1 rounded-full capitalize flex items-center gap-1.5 ${STATUS_COLORS[s].badge}`}
              >
                <span className={`inline-block size-1.5 rounded-full ${STATUS_COLORS[s].dot}`} />
                {s} · {countByStatus[s]}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Recent Applications</h2>
        {total === 0 ? (
          <div className="border border-border rounded p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No applications yet — add your first one.
            </p>
            <Link
              href="/seeker/applications"
              className="inline-block text-sm bg-primary text-primary-foreground rounded px-4 py-2 hover:opacity-90 transition-opacity"
            >
              Add Application
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentApplications.map((a) => (
              <Link
                key={a.id}
                href={`/seeker/applications/${a.id}`}
                className="border border-border rounded p-3 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {a.jobTitle} @ {a.companyName}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${STATUS_COLORS[a.status]?.badge ?? "bg-muted text-muted-foreground"}`}
                >
                  {a.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {total > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Upcoming Follow-ups</h2>
          {upcomingFollowUps.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No follow-ups due in the next 7 days. Set a follow-up date on an application to see it here.
            </p>
          )}
          {upcomingFollowUps.length > 0 && (
            <div className="space-y-2">
              {upcomingFollowUps.map((a) => {
                const label = followUpLabel(a.dueDate, today);
                return (
                  <a
                    key={a.id}
                    href={`/seeker/applications/${a.id}`}
                    className="border border-border rounded p-3 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {a.jobTitle} @ {a.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{a.status}</p>
                    </div>
                    <span
                      className={
                        "text-xs px-2 py-0.5 rounded whitespace-nowrap " +
                        (label.tone === "overdue"
                          ? "bg-destructive/10 text-destructive"
                          : label.tone === "today"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      {label.text}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
