import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { randomBytes } from "crypto";

// Generate a random 16-character hex string for slug
function generateSlug(): string {
  return randomBytes(8).toString("hex");
}

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
    const { name, workflowId, tenantId } = body;

    // Validation
    if (!name || !workflowId) {
      return NextResponse.json(
        { error: "Missing required fields: name, workflowId" },
        { status: 400 }
      );
    }

    // Generate random slug
    const slug = generateSlug();

    // Create agent with optional tenantId
    const newAgent = await db
      .insert(agents)
      .values({
        name,
        slug,
        workflowId,
        tenantId: tenantId || null,
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
