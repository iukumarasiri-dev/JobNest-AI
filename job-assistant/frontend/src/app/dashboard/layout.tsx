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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-6">
            <Image
              src="/images/jobnest.png"
              alt="JobNest AI"
              width={939}
              height={381}
              priority
              className="h-9 w-auto"
            />

            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors " +
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

            <button
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={navOpen}
              className="md:hidden border border-border rounded p-1.5 hover:bg-muted"
            >
              {navOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleLogout} className="text-sm underline">
              Log out
            </button>
          </div>
        </div>

        {navOpen && (
          <nav className="md:hidden border-t border-border p-4 flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setNavOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors " +
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
        )}
      </header>

      {logoutError && <p className="text-sm text-destructive px-4 pt-4">{logoutError}</p>}

      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
