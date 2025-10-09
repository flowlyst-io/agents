import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

// GET /api/agents - List all agents
export async function GET() {
  try {
    const allAgents = await db
      .select()
      .from(agents)
      .orderBy(desc(agents.createdAt));

    return NextResponse.json(allAgents);
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, workflowId } = body;

    // Validation
    if (!name || !slug || !workflowId) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, workflowId" },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
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

    // Create agent
    const newAgent = await db
      .insert(agents)
      .values({
        name,
        slug,
        workflowId,
      })
      .returning();

    return NextResponse.json(newAgent[0], { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create agent:", error);

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
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
