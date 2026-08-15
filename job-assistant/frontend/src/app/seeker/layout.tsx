"use client";

import { LayoutDashboard, Briefcase, FileText, Rss, MessageCircle } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const JOB_SEEKER_NAV_ITEMS: NavItem[] = [
  {
    href: "/seeker/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    children: [
      { href: "/seeker/applications", label: "Applications", icon: Briefcase },
      { href: "/seeker/resumes", label: "Resumes", icon: FileText },
    ],
  },
  { href: "/seeker/feed", label: "Feed", icon: Rss },
  { href: "/seeker/messages", label: "Messages", icon: MessageCircle },
];

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      requiredRole="JOB_SEEKER"
      otherRoleDashboardHref="/employer/dashboard"
      navItems={JOB_SEEKER_NAV_ITEMS}
    >
      {children}
    </DashboardShell>
  );
}
