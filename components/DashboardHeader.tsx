"use client";

import Link from "next/link";

type DashboardHeaderProps = {
  title: string;
  backLink?: string;
  backLabel?: string;
};

export function DashboardHeader({
  title,
  backLink,
  backLabel = "All Agents",
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        {backLink ? (
          <Link
            href={backLink}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            {backLabel}
          </Link>
        ) : (
          <div />
        )}
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
        <div className="w-24" />
      </div>
    </header>
  );
}
