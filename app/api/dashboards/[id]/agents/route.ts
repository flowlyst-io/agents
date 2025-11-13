import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dashboards, dashboardAgents, agents } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

// POST /api/dashboards/[id]/agents - Add agents to dashboard
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { agentIds } = body;

    // Validation
    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid agentIds array" },
        { status: 400 }
      );
    }

    // Check if dashboard exists
    const dashboard = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, id))
      .limit(1);

    if (dashboard.length === 0) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    // Check if agents exist
    const existingAgents = await db
      .select()
      .from(agents)
      .where(inArray(agents.id, agentIds));

    if (existingAgents.length !== agentIds.length) {
      return NextResponse.json(
        { error: "One or more agents not found" },
        { status: 404 }
      );
    }

    // Get current max order for this dashboard
    const maxOrderResult = await db
      .select({
        maxOrder: sql<number>`COALESCE(MAX(${dashboardAgents.order}), -1)`,
      })
      .from(dashboardAgents)
      .where(eq(dashboardAgents.dashboardId, id));

    let currentOrder = maxOrderResult[0]?.maxOrder ?? -1;

    // Insert agent associations (skip if already exists)
    const values = agentIds.map((agentId) => ({
      dashboardId: id,
      agentId,
      order: ++currentOrder,
    }));

    // Use insert...onConflictDoNothing to avoid duplicates
    await db
      .insert(dashboardAgents)
      .values(values)
      .onConflictDoNothing();

    // Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to add agents to dashboard:", error);
    return NextResponse.json(
      { error: "Failed to add agents to dashboard" },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboards/[id]/agents - Remove agents from dashboard
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { agentIds } = body;

    // Validation
    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid agentIds array" },
        { status: 400 }
      );
    }

    // Check if dashboard exists
    const dashboard = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, id))
      .limit(1);

    if (dashboard.length === 0) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    // Delete agent associations
    await db
      .delete(dashboardAgents)
      .where(
        and(
          eq(dashboardAgents.dashboardId, id),
          inArray(dashboardAgents.agentId, agentIds)
        )
      );

    // Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to remove agents from dashboard:", error);
    return NextResponse.json(
      { error: "Failed to remove agents from dashboard" },
      { status: 500 }
    );
  }
}
