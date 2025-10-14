import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ChatKitPanel } from "@/components/ChatKitPanel";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch agent by slug from database
  const agent = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, slug))
    .limit(1);

  // If agent doesn't exist, show 404
  if (!agent.length) {
    notFound();
  }

  return <ChatKitPanel workflowId={agent[0].workflowId} />;
}
