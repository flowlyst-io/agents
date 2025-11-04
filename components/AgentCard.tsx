"use client";

type AgentCardProps = {
  name: string;
  slug: string;
  clientSlug: string;
  icon?: string;
};

export function AgentCard({ name, slug, clientSlug, icon = "🤖" }: AgentCardProps) {
  return (
    <a
      href={`/embed/dashboard/${clientSlug}/${slug}`}
      className="group block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-5xl transition-transform group-hover:scale-110">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {name}
        </h3>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Click to chat
        </div>
      </div>
    </a>
  );
}
