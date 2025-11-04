import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ChatKitPanel } from "@/components/ChatKitPanel";
import { DashboardHeader } from "@/components/DashboardHeader";

// Hard-coded workflow IDs for UTB client (POC)
const CLIENT_WORKFLOWS: Record<string, string[]> = {
  utb: [
    "wf_690a4234fa908190873eea1a64035039035ee8e865a3cd4b",
    "wf_690253c4ecac819089f591d7604d3f3e02bbca51471a4822",
  ],
};

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ clientSlug: string; agentSlug: string }>;
}) {
  const { clientSlug, agentSlug } = await params;

  // Check if client exists in our hard-coded config
  const workflowIds = CLIENT_WORKFLOWS[clientSlug];
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
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <DashboardHeader
        title={agent[0].name}
        backLink={`/embed/dashboard/${clientSlug}`}
      />
      <div className="flex-1 overflow-hidden">
        <ChatKitPanel workflowId={agent[0].workflowId} />
      </div>
    </div>
  );
}
