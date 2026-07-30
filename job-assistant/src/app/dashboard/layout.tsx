import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
          <UserButton />
        </header>
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}