"use client";

import { useState } from "react";
import type { Applicant } from "../types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ApplicantsPanel({ applicants, loading }: { applicants: Applicant[] | undefined; loading: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      {loading && <p className="text-xs text-muted-foreground">Loading applicants...</p>}
      {!loading && applicants?.length === 0 && (
        <p className="text-xs text-muted-foreground">No applicants yet.</p>
      )}
      {applicants?.map((a) => (
        <div key={a.id} className="border border-border rounded p-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium">{a.applicant.name ?? a.applicant.email}</p>
              <p className="text-xs text-muted-foreground">{a.applicant.email}</p>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.createdAt)}</p>
          </div>
          {a.resume && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setExpandedId((prev) => (prev === a.id ? null : a.id))}
                className="text-xs underline"
              >
                {expandedId === a.id ? "Hide resume" : `View resume: ${a.resume.title}`}
              </button>
              {expandedId === a.id && a.resume.rawText && (
                <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground bg-muted rounded p-2 max-h-64 overflow-y-auto">
                  {a.resume.rawText}
                </pre>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
