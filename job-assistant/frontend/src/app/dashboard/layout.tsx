"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLogoutError("");
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : "Failed to log out. Please try again.");
    }
  }

  const navLinks = (
    <nav className="flex flex-col gap-2 text-sm">
      <a href="/dashboard" onClick={() => setNavOpen(false)}>
        Dashboard
      </a>
      <a href="/dashboard/applications" onClick={() => setNavOpen(false)}>
        Applications
      </a>
      <a href="/dashboard/resumes" onClick={() => setNavOpen(false)}>
        Resumes
      </a>
    </nav>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <aside className="hidden md:block w-64 shrink-0 border-r border-border p-4">
        <h2 className="font-semibold mb-6">JobNest AI</h2>
        {navLinks}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="border border-border rounded px-2 py-1 text-sm"
            >
              ☰
            </button>
            <h2 className="font-semibold">JobNest AI</h2>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleLogout} className="text-sm underline">
              Log out
            </button>
          </div>
        </header>

        {navOpen && (
          <div className="md:hidden border-b border-border p-4">
            {navLinks}
          </div>
        )}

        {logoutError && (
          <p className="text-sm text-destructive px-4 pt-4">{logoutError}</p>
        )}

        <main className="p-4 sm:p-6 flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
