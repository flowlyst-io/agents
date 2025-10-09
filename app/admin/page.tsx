"use client";

import { useState, useEffect } from "react";
import { AgentModal } from "@/components/AgentModal";
import type { Agent } from "@/lib/db/schema";

export default function AdminPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [embedSnippet, setEmbedSnippet] = useState<string | null>(null);

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAgent(null);
    setEmbedSnippet(null);
    setIsModalOpen(true);
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setEmbedSnippet(null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    slug: string;
    workflowId: string;
  }) => {
    if (editingAgent) {
      // Update existing agent
      const response = await fetch(`/api/agents/${editingAgent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update agent");
      }

      const updatedAgent = await response.json();
      setAgents((prev) =>
        prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
      );
      showEmbedSnippet(updatedAgent.slug);
    } else {
      // Create new agent
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create agent");
      }

      const newAgent = await response.json();
      setAgents((prev) => [newAgent, ...prev]);
      showEmbedSnippet(newAgent.slug);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete agent:", error);
      alert("Failed to delete agent");
    }
  };

  const showEmbedSnippet = (slug: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const snippet = `<iframe
  src="${origin}/embed/${slug}"
  width="100%"
  height="700"
  style="border:none; border-radius:12px; overflow:hidden">
</iframe>`;
    setEmbedSnippet(snippet);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Agent Management
          </h1>
          <button
            onClick={handleCreate}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + New Agent
          </button>
        </div>

        {/* Embed Snippet Display */}
        {embedSnippet && (
          <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Embed Code
              </h3>
              <button
                onClick={() => copyToClipboard(embedSnippet)}
                className="rounded bg-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {embedSnippet}
            </pre>
          </div>
        )}

        {/* Agents List */}
        {agents.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-slate-800">
            <p className="text-slate-600 dark:text-slate-400">
              No agents yet. Create your first agent to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-slate-800">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Workflow ID
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                      {agent.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {agent.slug}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                      {agent.workflowId}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => showEmbedSnippet(agent.slug)}
                        className="mr-2 text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Copy Embed
                      </button>
                      <button
                        onClick={() => handleEdit(agent)}
                        className="mr-2 text-slate-600 hover:underline dark:text-slate-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="text-red-600 hover:underline dark:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AgentModal
        isOpen={isModalOpen}
        agent={editingAgent}
        onSave={handleSave}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
