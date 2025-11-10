import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { AgentCard } from "@/components/AgentCard";
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
  alshaya: [
    "wf_690a4234fa908190873eea1a64035039035ee8e865a3cd4b", // Code of Conduct + 5 policy agents
  ],
  "alshaya-xero": [
    "wf_690253c4ecac819089f591d7604d3f3e02bbca51471a4822", // Tax and Accounting Agent
  ],
};

// Icon mapping (can be customized per agent name)
const getAgentIcon = (name: string, clientSlug: string): string => {
  const nameLower = name.toLowerCase();

  // Alshaya-specific icons
  if (clientSlug === "alshaya" || clientSlug === "alshaya-xero") {
    if (nameLower.includes("tax") && nameLower.includes("accounting")) return "💼";
    if (nameLower.includes("conduct")) return "📋";
    if (nameLower.includes("policy")) return "📄";
    if (nameLower.includes("payroll") || nameLower.includes("hr")) return "👥";
    if (nameLower.includes("operations")) return "⚙️";
    if (nameLower.includes("tax code")) return "📊";
    if (nameLower.includes("labour")) return "👷";
  }

  // Bellwood-specific icons
  if (clientSlug === "bellwood") {
    if (nameLower.includes("policy") || nameLower.includes("guideline")) return "📋";
    if (nameLower.includes("contract")) return "📄";
    if (nameLower.includes("strategic") || nameLower.includes("plan")) return "🎯";
  }

  // Default icons for all clients
  if (nameLower.includes("support") || nameLower.includes("help")) return "💬";
  if (nameLower.includes("sales") || nameLower.includes("sell")) return "💼";
  if (nameLower.includes("tech") || nameLower.includes("engineering")) return "🔧";
  if (nameLower.includes("hr") || nameLower.includes("people")) return "👥";
  return "🤖"; // Default icon
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>;
}) {
  const { clientSlug } = await params;

  // Check if client exists in our hard-coded config
  const workflowIds = CLIENT_WORKFLOWS[clientSlug];
  if (!workflowIds) {
    notFound();
  }

  // Fetch agents from database by workflow IDs
  const clientAgents = await db
    .select()
    .from(agents)
    .where(inArray(agents.workflowId, workflowIds));

  // If no agents found, show empty state
  if (clientAgents.length === 0) {
    return (
      <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-slate-950">
        <DashboardHeader title="Agents" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <div className="mb-4 text-6xl">🤖</div>
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
              No agents available
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Contact your administrator to set up agents.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-slate-950">
      <DashboardHeader title="Agents" />
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
            {clientAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                name={agent.name}
                slug={agent.slug}
                clientSlug={clientSlug}
                icon={getAgentIcon(agent.name, clientSlug)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
