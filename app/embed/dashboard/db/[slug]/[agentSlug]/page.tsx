import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dashboards, dashboardAgents, agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ChatKitPanel } from "@/components/ChatKitPanel";
import { DashboardHeader } from "@/components/DashboardHeader";

export default async function DatabaseAgentChatPage({
  params,
}: {
  params: Promise<{ slug: string; agentSlug: string }>;
}) {
  const { slug, agentSlug } = await params;

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

  // Fetch the specific agent by slug
  const agent = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, agentSlug))
    .limit(1);

  if (!agent.length) {
    notFound();
  }

  // Verify the agent is associated with this dashboard
  const dashboardAgent = await db
    .select()
    .from(dashboardAgents)
    .where(
      and(
        eq(dashboardAgents.dashboardId, dashboardData.id),
        eq(dashboardAgents.agentId, agent[0].id)
      )
    )
    .limit(1);

  if (dashboardAgent.length === 0) {
    notFound();
  }

  return (
    <>
      <div className="flex h-screen w-full flex-col overflow-hidden">
        <DashboardHeader
          title={agent[0].name}
          backLink={`/embed/dashboard/db/${slug}`}
        />
        <div className="flex-1 overflow-hidden">
          <ChatKitPanel key={agent[0].workflowId} workflowId={agent[0].workflowId} />
        </div>
      </div>
    </>
  );
}
