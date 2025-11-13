import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dashboards, dashboardAgents, agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ChatKitPanel } from "@/components/ChatKitPanel";
import { DashboardHeader } from "@/components/DashboardHeader";

// Legacy hard-coded workflow IDs per client
const CLIENT_WORKFLOWS: Record<string, string[]> = {
  utb: [
    "wf_690a4234fa908190873eea1a64035039035ee8e865a3cd4b",
    "wf_690253c4ecac819089f591d7604d3f3e02bbca51471a4822",
  ],
  bellwood: [
    "wf_690be00381d08190b31b24589592dd09046d49bb9156563c",
    "wf_690bdf2ead0881909f1d81fa8cc80c810f1ee4cdaa4a0413",
    "wf_690bde7970348190a9527dbd8357408e0b69a5ee352abc0a",
    "wf_690bddb16f18819087bbcb2af482bb480a23e612197bb03a",
    "wf_690bd4f8d24c8190b6a2dfd2b8b6058f0df37fc036b98a7c",
    "wf_690bd8e7b75c81908e017cb0a3a567bf0ed3ee2a4181f370",
  ],
  alshaya: [
    "wf_690a4234fa908190873eea1a64035039035ee8e865a3cd4b",
  ],
  "alshaya-xero": [
    "wf_690253c4ecac819089f591d7604d3f3e02bbca51471a4822",
  ],
};

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ slug: string; agentSlug: string }>;
}) {
  const { slug, agentSlug } = await params;

  // Try database first (new system)
  const dashboardResult = await db
    .select({
      id: dashboards.id,
      title: dashboards.title,
      slug: dashboards.slug,
    })
    .from(dashboards)
    .where(eq(dashboards.slug, slug))
    .limit(1);

  // Database dashboard found
  if (dashboardResult.length > 0) {
    const dashboardData = dashboardResult[0];

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
            backLink={`/embed/dashboard/${slug}`}
          />
          <div className="flex-1 overflow-hidden">
            <ChatKitPanel key={agent[0].workflowId} workflowId={agent[0].workflowId} />
          </div>
        </div>
      </>
    );
  }

  // Fallback to legacy CLIENT_WORKFLOWS system
  const workflowIds = CLIENT_WORKFLOWS[slug];
  if (!workflowIds) {
    notFound();
  }

  // Fetch the specific agent by slug, ensuring it belongs to this client
  const agent = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, agentSlug))
    .limit(1);

  // If agent doesn't exist or doesn't belong to this client, show 404
  if (!agent.length || !workflowIds.includes(agent[0].workflowId)) {
    notFound();
  }

  return (
    <>
      <div className="flex h-screen w-full flex-col overflow-hidden">
        <DashboardHeader
          title={agent[0].name}
          backLink={`/embed/dashboard/${slug}`}
        />
        <div className="flex-1 overflow-hidden">
          <ChatKitPanel key={agent[0].workflowId} workflowId={agent[0].workflowId} />
        </div>
      </div>
    </>
  );
}
