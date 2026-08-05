import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">JobNest AI</h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Track your job applications and generate tailored cover letters with AI.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded bg-black px-5 py-2 text-white dark:bg-white dark:text-black"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="rounded border px-5 py-2"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
