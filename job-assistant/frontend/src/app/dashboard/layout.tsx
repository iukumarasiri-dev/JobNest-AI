"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Briefcase, FileText, UserCircle, Menu, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/applications", label: "Applications", icon: Briefcase },
  { href: "/dashboard/resumes", label: "Resumes", icon: FileText },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  const navLinks = (
    <nav className="flex flex-col gap-1 text-sm">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setNavOpen(false)}
            aria-current={active ? "page" : undefined}
            className={
              "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors " +
              (active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-border p-4">
        <Image
          src="/images/jobnest.png"
          alt="JobNest AI"
          width={939}
          height={381}
          priority
          className="h-14 w-auto mb-6 px-3"
        />
        {navLinks}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={navOpen}
              className="border border-border rounded p-1.5 hover:bg-muted"
            >
              {navOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
            <Image src="/images/jobnest.png" alt="JobNest AI" width={939} height={381} className="h-8 w-auto" />
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
