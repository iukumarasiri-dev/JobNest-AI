"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const STATUS_OPTIONS = ["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"];

type Application = {
  id: string;
  status: string;
};

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[] | null>(null);

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

  if (!applications) return <p>Loading...</p>;

  const total = applications.length;
  const countByStatus = Object.fromEntries(
    STATUS_OPTIONS.map((s) => [s, applications.filter((a) => a.status === s).length])
  );

  // "Responded" = employer gave any signal beyond silence: interview, offer, or rejected.
  const responded = countByStatus.interview + countByStatus.offer + countByStatus.rejected;
  const submitted = total - countByStatus.wishlist;
  const responseRate = submitted > 0 ? Math.round((responded / submitted) * 100) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div className="border rounded p-4">
          <p className="text-xs text-gray-500 mb-1">Total Applications</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-xs text-gray-500 mb-1">Response Rate</p>
          <p className="text-2xl font-bold">{responseRate === null ? "—" : `${responseRate}%`}</p>
          <p className="text-xs text-gray-400 mt-1">of submitted apps with a reply</p>
        </div>
        {STATUS_OPTIONS.map((s) => (
          <div key={s} className="border rounded p-4">
            <p className="text-xs text-gray-500 mb-1 capitalize">{s}</p>
            <p className="text-2xl font-bold">{countByStatus[s]}</p>
          </div>
        ))}
      </div>

      {total === 0 && (
        <p className="text-sm text-gray-500">
          No applications yet. Head to{" "}
          <a href="/dashboard/applications" className="underline">
            Applications
          </a>{" "}
          to add your first one.
        </p>
      )}
    </div>
  );
}
