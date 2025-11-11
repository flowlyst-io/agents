import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, agents } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

// GET /api/tenants - List all tenants with agent counts
export async function GET() {
  try {
    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
        agentCount: sql<number>`cast(count(${agents.id}) as int)`,
      })
      .from(tenants)
      .leftJoin(agents, eq(agents.tenantId, tenants.id))
      .groupBy(tenants.id)
      .orderBy(desc(tenants.createdAt));

    return NextResponse.json(allTenants);
  } catch (error) {
    console.error("Failed to fetch tenants:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}

// POST /api/tenants - Create a new tenant
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Tenant name is required" },
        { status: 400 }
      );
    }

    // Create tenant
    const newTenant = await db
      .insert(tenants)
      .values({
        name: name.trim(),
      })
      .returning();

    return NextResponse.json(newTenant[0], { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create tenant:", error);

    // Handle unique constraint violation (duplicate name)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "A tenant with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create tenant" },
      { status: 500 }
    );
  }
}
