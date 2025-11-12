import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dashboards, tenants } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

// Generate a random 16-character hex string for slug
function generateSlug(): string {
  return randomBytes(8).toString("hex");
}

// GET /api/dashboards - List all dashboards with tenant info and agent count
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    // Build base query with $dynamic() for conditional chaining
    let query = db
      .select({
        id: dashboards.id,
        title: dashboards.title,
        slug: dashboards.slug,
        tenantId: dashboards.tenantId,
        tenantName: tenants.name,
        createdAt: dashboards.createdAt,
        updatedAt: dashboards.updatedAt,
        agentCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM dashboard_agents
          WHERE dashboard_agents.dashboard_id = ${dashboards.id}
        )`,
      })
      .from(dashboards)
      .leftJoin(tenants, eq(dashboards.tenantId, tenants.id))
      .$dynamic();

    // Apply tenant filter if provided
    if (tenantId && tenantId !== "all") {
      if (tenantId === "general") {
        query = query.where(sql`${dashboards.tenantId} IS NULL`);
      } else {
        query = query.where(eq(dashboards.tenantId, tenantId));
      }
    }

    // Apply ordering and execute
    const allDashboards = await query.orderBy(desc(dashboards.createdAt));

    return NextResponse.json(allDashboards);
  } catch (error) {
    console.error("Failed to fetch dashboards:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboards" },
      { status: 500 }
    );
  }
}

// POST /api/dashboards - Create a new dashboard
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, tenantId } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }

    // Generate random slug
    const slug = generateSlug();

    // Create dashboard with optional tenantId
    const newDashboard = await db
      .insert(dashboards)
      .values({
        title,
        slug,
        tenantId: tenantId || null,
      })
      .returning();

    return NextResponse.json(newDashboard[0], { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create dashboard:", error);

    // Handle unique constraint violation (duplicate slug)
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
      { error: "Failed to create dashboard" },
      { status: 500 }
    );
  }
}
