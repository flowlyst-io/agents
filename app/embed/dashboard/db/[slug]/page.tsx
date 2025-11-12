import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dashboards, dashboardAgents, agents } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { AgentCard } from "@/components/AgentCard";
import { DashboardHeader } from "@/components/DashboardHeader";

// Icon mapping (can be customized per agent name)
const getAgentIcon = (name: string): string => {
  const nameLower = name.toLowerCase();

  // Specific keywords
  if (nameLower.includes("tax") && nameLower.includes("accounting")) return "💼";
  if (nameLower.includes("conduct")) return "📋";
  if (nameLower.includes("policy")) return "📄";
  if (nameLower.includes("payroll") || nameLower.includes("hr")) return "👥";
  if (nameLower.includes("operations")) return "⚙️";
  if (nameLower.includes("tax code")) return "📊";
  if (nameLower.includes("labour")) return "👷";
  if (nameLower.includes("contract")) return "📄";
  if (nameLower.includes("strategic") || nameLower.includes("plan")) return "🎯";
  if (nameLower.includes("guideline")) return "📋";
  if (nameLower.includes("support") || nameLower.includes("help")) return "💬";
  if (nameLower.includes("sales") || nameLower.includes("sell")) return "💼";
  if (nameLower.includes("tech") || nameLower.includes("engineering")) return "🔧";

  return "🤖"; // Default icon
};

export default async function DatabaseDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch dashboard from database
  const dashboard = await db
    .select({
      id: dashboards.id,
      title: dashboards.title,
      slug: dashboards.slug,
    })
    .from(dashboards)
    .where(eq(dashboards.slug, slug))
    .limit(1);

  if (dashboard.length === 0) {
    notFound();
  }

  const dashboardData = dashboard[0];

  // Fetch agents associated with this dashboard (ordered)
  const dashboardWithAgents = await db
    .select({
      agentId: agents.id,
      agentName: agents.name,
      agentSlug: agents.slug,
      workflowId: agents.workflowId,
      order: dashboardAgents.order,
    })
    .from(dashboardAgents)
    .innerJoin(agents, eq(dashboardAgents.agentId, agents.id))
    .where(eq(dashboardAgents.dashboardId, dashboardData.id))
    .orderBy(asc(dashboardAgents.order));

  // If no agents found, show empty state
  if (dashboardWithAgents.length === 0) {
    return (
      <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-slate-950">
        <DashboardHeader title={dashboardData.title} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <div className="mb-4 text-6xl">🤖</div>
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
              No agents available
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Contact your administrator to add agents to this dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-slate-950">
      <DashboardHeader title={dashboardData.title} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Choose an agent
            </h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Select an agent to start a conversation
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {dashboardWithAgents.map((da) => (
              <AgentCard
                key={da.agentId}
                name={da.agentName}
                slug={da.agentSlug}
                clientSlug={`db/${slug}`}
                icon={getAgentIcon(da.agentName)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
