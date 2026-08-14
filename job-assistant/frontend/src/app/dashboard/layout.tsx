"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Briefcase, FileText, Building2, Menu, X, Rss, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string; icon: LucideIcon }[];
};

const JOB_SEEKER_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    children: [
      { href: "/dashboard/applications", label: "Applications", icon: Briefcase },
      { href: "/dashboard/resumes", label: "Resumes", icon: FileText },
    ],
  },
  { href: "/dashboard/feed", label: "Feed", icon: Rss },
];

const EMPLOYER_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/company", label: "Company Profile", icon: Building2 },
  { href: "/dashboard/feed", label: "Feed", icon: Rss },
];

const EMPLOYER_ONLY_PREFIXES = ["/dashboard/company"];
// "/dashboard" is deliberately matched exactly (not as a prefix) — every other
// dashboard route lives under "/dashboard/...", so a prefix match here would
// wrongly claim every shared/employer route (feed, profile, company) too.
const JOB_SEEKER_ONLY_EXACT = ["/dashboard"];
const JOB_SEEKER_ONLY_PREFIXES = ["/dashboard/applications", "/dashboard/resumes"];

function isEmployerOnlyPath(pathname: string) {
  return EMPLOYER_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isJobSeekerOnlyPath(pathname: string) {
  return (
    JOB_SEEKER_ONLY_EXACT.includes(pathname) ||
    JOB_SEEKER_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [role, setRole] = useState<"JOB_SEEKER" | "EMPLOYER" | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((me) => setRole(me.role === "EMPLOYER" ? "EMPLOYER" : "JOB_SEEKER"))
      .catch(() => setAuthFailed(true))
      .finally(() => setRoleChecked(true));
  }, []);

  useEffect(() => {
    if (!roleChecked || !authFailed) return;
    router.replace("/login");
  }, [roleChecked, authFailed, router]);

  const roleMismatch =
    !!role &&
    ((role === "EMPLOYER" && isJobSeekerOnlyPath(pathname)) ||
      (role === "JOB_SEEKER" && isEmployerOnlyPath(pathname)));

  useEffect(() => {
    if (!roleChecked || !roleMismatch || !role) return;
    router.replace(role === "EMPLOYER" ? "/dashboard/company" : "/dashboard");
  }, [roleChecked, roleMismatch, role, router]);

  const NAV_ITEMS = role === "EMPLOYER" ? EMPLOYER_NAV_ITEMS : JOB_SEEKER_NAV_ITEMS;

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

  function isParentActive(item: NavItem) {
    return isActive(item.href) || !!item.children?.some((c) => isActive(c.href));
  }

  useEffect(() => {
    setDashboardMenuOpen(false);
  }, [pathname]);

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
              {roleChecked && !authFailed && NAV_ITEMS.map((item) => {
                const { href, label, icon: Icon, children } = item;
                const active = isParentActive(item);

                if (!children) {
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
                }

                return (
                  <div
                    key={href}
                    className="relative"
                    onMouseEnter={() => setDashboardMenuOpen(true)}
                    onMouseLeave={() => setDashboardMenuOpen(false)}
                  >
                    <div
                      className={
                        "flex items-center rounded-lg text-sm transition-colors " +
                        (active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground")
                      }
                    >
                      <Link href={href} className="flex items-center gap-1.5 pl-3 pr-1 py-1.5">
                        <Icon className="size-4 shrink-0" />
                        {label}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDashboardMenuOpen((v) => !v)}
                        aria-label={`Toggle ${label} menu`}
                        aria-expanded={dashboardMenuOpen}
                        className="pr-2 pl-0.5 py-1.5"
                      >
                        <ChevronDown
                          className={`size-3.5 transition-transform ${dashboardMenuOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>

                    {dashboardMenuOpen && (
                      <div className="absolute top-full left-0 pt-1 min-w-[170px] z-20">
                        <div className="border border-border rounded-lg bg-background shadow-md py-1">
                          {children.map((child) => {
                            const childActive = isActive(child.href);
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={
                                  "flex items-center gap-2 px-3 py-2 text-sm transition-colors " +
                                  (childActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground")
                                }
                              >
                                <ChildIcon className="size-4 shrink-0" />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
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
            {NAV_ITEMS.map(({ href, label, icon: Icon, children }) => {
              const active = isActive(href);
              return (
                <div key={href}>
                  <Link
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
                  {children && (
                    <div className="ml-6 flex flex-col gap-1 mt-1">
                      {children.map((child) => {
                        const childActive = isActive(child.href);
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setNavOpen(false)}
                            aria-current={childActive ? "page" : undefined}
                            className={
                              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors " +
                              (childActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground")
                            }
                          >
                            <ChildIcon className="size-4 shrink-0" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </header>

      {logoutError && <p className="text-sm text-destructive px-4 pt-4">{logoutError}</p>}

      <main className="p-4 sm:p-6">
        {!roleChecked || authFailed || roleMismatch ? null : children}
      </main>
    </div>
  );
}
