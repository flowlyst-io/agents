import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ChatKitPanel } from "@/components/ChatKitPanel";
import { DashboardHeader } from "@/components/DashboardHeader";

// Hard-coded workflow IDs per client (POC)
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
    <>
      <div className="flex h-screen w-full flex-col overflow-hidden">
        <DashboardHeader
          title={agent[0].name}
          backLink={`/embed/dashboard/${clientSlug}`}
        />
        <div className="flex-1 overflow-hidden">
          <ChatKitPanel key={agent[0].workflowId} workflowId={agent[0].workflowId} />
        </div>
      </div>
    </>
  );
}
