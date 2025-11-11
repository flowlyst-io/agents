import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/agents/[id] - Update an agent
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, workflowId, tenantId } = body;

    // Validation: at least one field must be provided
    if (!name && !slug && !workflowId && tenantId === undefined) {
      return NextResponse.json(
        { error: "At least one field (name, slug, workflowId, tenantId) must be provided" },
        { status: 400 }
      );
    }

    // Validate slug if provided
    if (slug) {
      const slugPattern = /^[a-z0-9-]+$/;
      if (!slugPattern.test(slug)) {
        return NextResponse.json(
          {
            error:
              "Invalid slug format. Use only lowercase letters, numbers, and hyphens.",
          },
          { status: 400 }
        );
      }

      // Check for reserved slugs
      const reservedSlugs = ["api", "admin", "embed", "_next"];
      if (reservedSlugs.includes(slug)) {
        return NextResponse.json(
          { error: `Slug '${slug}' is reserved and cannot be used.` },
          { status: 400 }
        );
      }

      // Validate slug length
      if (slug.length > 50) {
        return NextResponse.json(
          { error: "Slug must be 50 characters or less" },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: {
      name?: string;
      slug?: string;
      workflowId?: string;
      tenantId?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (workflowId) updateData.workflowId = workflowId;
    if (tenantId !== undefined) updateData.tenantId = tenantId || null;

    // Update agent
    const updatedAgent = await db
      .update(agents)
      .set(updateData)
      .where(eq(agents.id, id))
      .returning();

    if (!updatedAgent.length) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(updatedAgent[0]);
  } catch (error: unknown) {
    console.error("Failed to update agent:", error);

    // Handle unique constraint violation (duplicate slug)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "An agent with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id] - Delete an agent
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete agent
    const deletedAgent = await db
      .delete(agents)
      .where(eq(agents.id, id))
      .returning();

    if (!deletedAgent.length) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete agent:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
