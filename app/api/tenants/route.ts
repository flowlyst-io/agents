import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, agents } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";

// GET /api/tenants - List all tenants with agent counts
export async function GET() {
  try {
    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
        agentCount: count(agents.id),
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
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Tenant name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Length validation (1-255 characters)
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Tenant name cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 255) {
      return NextResponse.json(
        { error: "Tenant name must be 255 characters or less" },
        { status: 400 }
      );
    }

    // Character validation (alphanumeric, spaces, hyphens, underscores, dots)
    const validNamePattern = /^[a-zA-Z0-9\s\-_.]+$/;
    if (!validNamePattern.test(trimmedName)) {
      return NextResponse.json(
        {
          error:
            "Tenant name can only contain letters, numbers, spaces, hyphens, underscores, and dots",
        },
        { status: 400 }
      );
    }

    // Create tenant
    const newTenant = await db
      .insert(tenants)
      .values({
        name: trimmedName,
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
