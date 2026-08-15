"use client";

import { LayoutDashboard, Building2, Rss } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const EMPLOYER_NAV_ITEMS: NavItem[] = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/company", label: "Company Profile", icon: Building2 },
  { href: "/employer/feed", label: "Feed", icon: Rss },
];

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell requiredRole="EMPLOYER" otherRoleDashboardHref="/seeker/dashboard" navItems={EMPLOYER_NAV_ITEMS}>
      {children}
    </DashboardShell>
  );
}
