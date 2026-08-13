import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  {
    title: "Track every application",
    description: "Keep every job, status, and follow-up date organized in one place.",
  },
  {
    title: "AI-tailored cover letters",
    description: "Generate cover letters and resume bullets matched to each job posting.",
  },
  {
    title: "Know where you stand",
    description: "See response rates and upcoming follow-ups at a glance.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Image src="/images/jobnest.png" alt="JobNest AI" width={939} height={381} priority className="h-9 w-auto" />
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-1.5 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Land your next job, <span className="text-primary">organized</span>.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Track your job applications and generate tailored cover letters with AI.
        </p>
        <div className="flex gap-4 pt-2">
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border px-6 py-2.5 font-medium hover:bg-muted"
          >
            Log in
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-5 text-left">
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
