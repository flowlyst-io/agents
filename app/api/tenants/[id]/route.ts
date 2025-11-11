import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/tenants/[id] - Update tenant name
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Update tenant
    const updatedTenant = await db
      .update(tenants)
      .set({
        name: trimmedName,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    if (!updatedTenant.length) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTenant[0]);
  } catch (error: unknown) {
    console.error("Failed to update tenant:", error);

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
      { error: "Failed to update tenant" },
      { status: 500 }
    );
  }
}

// DELETE /api/tenants/[id] - Delete tenant with options for agents
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // 'make_general' | 'reassign' | 'delete_agents'
    const targetTenantId = searchParams.get("targetTenantId");

    // Validate action
    if (!action || !["make_general", "reassign", "delete_agents"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be: make_general, reassign, or delete_agents" },
        { status: 400 }
      );
    }

    // If reassign, validate targetTenantId
    if (action === "reassign") {
      if (!targetTenantId) {
        return NextResponse.json(
          { error: "targetTenantId is required for reassign action" },
          { status: 400 }
        );
      }

      // Verify target tenant exists
      const targetTenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, targetTenantId))
        .limit(1);

      if (!targetTenant.length) {
        return NextResponse.json(
          { error: "Target tenant not found" },
          { status: 404 }
        );
      }
    }

    // Handle agents based on action
    if (action === "make_general") {
      // Set all agents' tenantId to NULL
      await db
        .update(agents)
        .set({ tenantId: null, updatedAt: new Date() })
        .where(eq(agents.tenantId, id));
    } else if (action === "reassign") {
      // Reassign all agents to target tenant
      await db
        .update(agents)
        .set({ tenantId: targetTenantId, updatedAt: new Date() })
        .where(eq(agents.tenantId, id));
    } else if (action === "delete_agents") {
      // Delete all agents belonging to this tenant
      await db
        .delete(agents)
        .where(eq(agents.tenantId, id));
    }

    // Delete the tenant
    const deletedTenant = await db
      .delete(tenants)
      .where(eq(tenants.id, id))
      .returning();

    if (!deletedTenant.length) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tenant:", error);
    return NextResponse.json(
      { error: "Failed to delete tenant" },
      { status: 500 }
    );
  }
}
