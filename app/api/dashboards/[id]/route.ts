import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dashboards, dashboardAgents, agents, tenants } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/dashboards/[id] - Get dashboard with agents
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch dashboard with tenant
    const dashboard = await db
      .select({
        id: dashboards.id,
        title: dashboards.title,
        slug: dashboards.slug,
        tenantId: dashboards.tenantId,
        tenantName: tenants.name,
        createdAt: dashboards.createdAt,
        updatedAt: dashboards.updatedAt,
      })
      .from(dashboards)
      .leftJoin(tenants, eq(dashboards.tenantId, tenants.id))
      .where(eq(dashboards.id, id))
      .limit(1);

    if (dashboard.length === 0) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    // Fetch agents associated with this dashboard
    const dashboardWithAgents = await db
      .select({
        agentId: agents.id,
        agentName: agents.name,
        agentSlug: agents.slug,
        workflowId: agents.workflowId,
        agentTenantId: agents.tenantId,
        agentTenantName: tenants.name,
        order: dashboardAgents.order,
      })
      .from(dashboardAgents)
      .innerJoin(agents, eq(dashboardAgents.agentId, agents.id))
      .leftJoin(tenants, eq(agents.tenantId, tenants.id))
      .where(eq(dashboardAgents.dashboardId, id))
      .orderBy(asc(dashboardAgents.order));

    // Format response
    const response = {
      ...dashboard[0],
      tenant: dashboard[0].tenantId
        ? { id: dashboard[0].tenantId, name: dashboard[0].tenantName }
        : null,
      agents: dashboardWithAgents.map((da) => ({
        id: da.agentId,
        name: da.agentName,
        slug: da.agentSlug,
        workflowId: da.workflowId,
        tenantId: da.agentTenantId,
        tenantName: da.agentTenantName,
        order: da.order,
      })),
    };

    // Remove redundant fields
    delete (response as { tenantName?: string }).tenantName;

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}

// PATCH /api/dashboards/[id] - Update dashboard
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, tenantId } = body;

    // Check if dashboard exists
    const existing = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    // Build update object with only provided fields
    const updates: {
      title?: string;
      slug?: string;
      tenantId?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = title;
    if (slug !== undefined) updates.slug = slug;
    if (tenantId !== undefined) updates.tenantId = tenantId || null;

    // Update dashboard
    const updated = await db
      .update(dashboards)
      .set(updates)
      .where(eq(dashboards.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error: unknown) {
    console.error("Failed to update dashboard:", error);

    // Handle unique constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "A dashboard with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update dashboard" },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboards/[id] - Delete dashboard
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if dashboard exists
    const existing = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    // Delete dashboard (cascade will delete dashboard_agents)
    await db.delete(dashboards).where(eq(dashboards.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete dashboard:", error);
    return NextResponse.json(
      { error: "Failed to delete dashboard" },
      { status: 500 }
    );
  }
}
