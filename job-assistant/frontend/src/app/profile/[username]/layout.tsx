"use client";

import { DashboardShell } from "@/components/dashboard-shell";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell navItems={[]}>{children}</DashboardShell>;
}
