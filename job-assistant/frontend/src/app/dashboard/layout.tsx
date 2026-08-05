"use client";

import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r p-4">
        <h2 className="font-semibold mb-6">JobNest AI</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <a href="/dashboard">Dashboard</a>
          <a href="/dashboard/applications">Applications</a>
          <a href="/dashboard/resumes">Resumes</a>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="border-b p-4 flex justify-end">
          <button onClick={handleLogout} className="text-sm underline">
            Log out
          </button>
        </header>
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
