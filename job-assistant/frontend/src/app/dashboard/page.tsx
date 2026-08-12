"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const STATUS_OPTIONS = ["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"];

type Application = {
  id: string;
  companyName: string;
  jobTitle: string;
  status: string;
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

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/applications");
      setApplications(data);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-border rounded p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Applications</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-xs text-muted-foreground mb-1">Response Rate</p>
          <p className="text-2xl font-bold">{responseRate === null ? "—" : `${responseRate}%`}</p>
          <p className="text-xs text-muted-foreground mt-1">of submitted apps with a reply</p>
        </div>
        {STATUS_OPTIONS.map((s) => (
          <div key={s} className="border border-border rounded p-4">
            <p className="text-xs text-muted-foreground mb-1 capitalize">{s}</p>
            <p className="text-2xl font-bold">{countByStatus[s]}</p>
          </div>
        ))}
      </div>

      {total === 0 && (
        <p className="text-sm text-muted-foreground">
          No applications yet. Head to{" "}
          <a href="/dashboard/applications" className="underline">
            Applications
          </a>{" "}
          to add your first one.
        </p>
      )}

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
                    href={`/dashboard/applications/${a.id}`}
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
