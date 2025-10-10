import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100">
          Flowlyst Agents
        </h1>
        <Link
          href="/admin"
          className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          I am an admin →
        </Link>
      </div>
    </main>
  );
}
