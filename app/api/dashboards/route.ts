import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dashboards, tenants } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ensure unique slug by appending number if needed
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.slug, slug))
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
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
    const { title, slug: providedSlug, tenantId } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }

    // Generate or use provided slug
    const baseSlug = providedSlug || generateSlug(title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    // Create dashboard with optional tenantId
    const newDashboard = await db
      .insert(dashboards)
      .values({
        title,
        slug: uniqueSlug,
        tenantId: tenantId || null,
      })
      .returning();

    return NextResponse.json(newDashboard[0], { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create dashboard:", error);

    // Handle unique constraint violation (duplicate slug - shouldn't happen with our logic)
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
