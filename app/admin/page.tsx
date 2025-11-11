"use client";

import { useState, useEffect } from "react";
import { AgentModal } from "@/components/AgentModal";
import { TenantModal } from "@/components/TenantModal";
import { DeleteTenantDialog } from "@/components/DeleteTenantDialog";
import type { Agent, Tenant } from "@/lib/db/schema";

type TenantWithCount = Tenant & { agentCount: number };

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"agents" | "tenants">("agents");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tenants, setTenants] = useState<TenantWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Agent modal state
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Tenant modal state
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Delete tenant dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState<TenantWithCount | null>(null);

  // Agent list UI state
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [copiedAgentId, setCopiedAgentId] = useState<string | null>(null);
  const [tenantFilter, setTenantFilter] = useState<string>("all");

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, tenantsRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/tenants"),
      ]);

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData);
      }

      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        setTenants(tenantsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Agent handlers
  const handleCreateAgent = () => {
    setEditingAgent(null);
    setExpandedAgentId(null);
    setIsAgentModalOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setExpandedAgentId(null);
    setIsAgentModalOpen(true);
  };

  const handleSaveAgent = async (data: {
    name: string;
    workflowId: string;
    tenantId: string | null;
    tenantName?: string;
  }) => {
    let finalTenantId = data.tenantId;

    // If a new tenant name was provided, create it first
    if (data.tenantName) {
      const createTenantRes = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.tenantName }),
      });

      if (!createTenantRes.ok) {
        const error = await createTenantRes.json();
        throw new Error(error.error || "Failed to create tenant");
      }

      const newTenant = await createTenantRes.json();
      finalTenantId = newTenant.id;
      await fetchData(); // Refresh to get new tenant
    }

    if (editingAgent) {
      // Update existing agent
      const response = await fetch(`/api/agents/${editingAgent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          workflowId: data.workflowId,
          tenantId: finalTenantId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update agent");
      }

      await fetchData();
    } else {
      // Create new agent
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          workflowId: data.workflowId,
          tenantId: finalTenantId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create agent");
      }

      await fetchData();
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to delete agent:", error);
      alert("Failed to delete agent");
    }
  };

  // Tenant handlers
  const handleCreateTenant = () => {
    setEditingTenant(null);
    setIsTenantModalOpen(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsTenantModalOpen(true);
  };

  const handleSaveTenant = async (data: { name: string }) => {
    if (editingTenant) {
      // Update existing tenant
      const response = await fetch(`/api/tenants/${editingTenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update tenant");
      }

      await fetchData();
    } else {
      // Create new tenant
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tenant");
      }

      await fetchData();
    }
  };

  const handleDeleteTenant = (tenant: TenantWithCount) => {
    setDeletingTenant(tenant);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteTenant = async (
    action: "make_general" | "reassign" | "delete_agents",
    targetTenantId?: string
  ) => {
    if (!deletingTenant) return;

    try {
      const params = new URLSearchParams({ action });
      if (targetTenantId) {
        params.append("targetTenantId", targetTenantId);
      }

      const response = await fetch(`/api/tenants/${deletingTenant.id}?${params}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete tenant");
      }

      await fetchData();
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      throw error;
    }
  };

  // Utility handlers
  const toggleExpanded = (agentId: string) => {
    setExpandedAgentId((prev) => (prev === agentId ? null : agentId));
  };

  const getEmbedSnippet = (slug: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `<iframe
  src="${origin}/embed/${slug}"
  width="100%"
  height="700"
  style="border:none; border-radius:12px; overflow:hidden">
</iframe>`;
  };

  const copyToClipboard = async (text: string, agentId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAgentId(agentId);
      setTimeout(() => {
        setCopiedAgentId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy to clipboard");
    }
  };

  const getTenantName = (tenantId: string | null): string => {
    if (!tenantId) return "General Purpose";
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : "Unknown";
  };

  const handleTenantClick = (tenantId: string) => {
    setActiveTab("agents");
    setTenantFilter(tenantId);
  };

  // Filter agents by tenant
  const filteredAgents = agents.filter((agent) => {
    if (tenantFilter === "all") return true;
    if (tenantFilter === "general") return agent.tenantId === null;
    return agent.tenantId === tenantFilter;
  });

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
        {/* Header with Tabs */}
        <div className="mb-6">
          <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
            Admin Dashboard
          </h1>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("agents")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "agents"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Agents
            </button>
            <button
              onClick={() => setActiveTab("tenants")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "tenants"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Tenants
            </button>
          </div>
        </div>

        {/* Agents Tab */}
        {activeTab === "agents" && (
          <div>
            {/* Agents Tab Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label htmlFor="tenant-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Filter by Tenant:
                </label>
                <select
                  id="tenant-filter"
                  value={tenantFilter}
                  onChange={(e) => setTenantFilter(e.target.value)}
                  className="rounded border border-slate-300 px-3 py-1 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="all">All Tenants</option>
                  <option value="general">General Purpose</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreateAgent}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                + New Agent
              </button>
            </div>

            {/* Agents List */}
            {filteredAgents.length === 0 ? (
              <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-slate-800">
                <p className="text-slate-600 dark:text-slate-400">
                  {tenantFilter === "all"
                    ? "No agents yet. Create your first agent to get started!"
                    : "No agents found for this filter."}
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
                        Tenant
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
                    {filteredAgents.map((agent) => (
                      <>
                        <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                            {agent.name}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                agent.tenantId
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                              }`}
                            >
                              {getTenantName(agent.tenantId)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                            {agent.workflowId}
                          </td>
                          <td className="px-6 py-4 text-right text-sm">
                            <a
                              href={`/embed/${agent.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mr-2 text-blue-600 hover:underline dark:text-blue-400"
                            >
                              Go to Agent
                            </a>
                            <button
                              onClick={() => toggleExpanded(agent.id)}
                              className="mr-2 text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {expandedAgentId === agent.id ? "Hide Embed" : "Show Embed"}
                            </button>
                            <button
                              onClick={() => handleEditAgent(agent)}
                              className="mr-2 text-slate-600 hover:underline dark:text-slate-400"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="text-red-600 hover:underline dark:text-red-400"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                        {expandedAgentId === agent.id && (
                          <tr key={`${agent.id}-expanded`}>
                            <td colSpan={4} className="bg-slate-50 px-6 py-4 dark:bg-slate-700">
                              <div className="relative">
                                <pre className="overflow-x-auto rounded bg-slate-100 p-3 pr-12 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                  {getEmbedSnippet(agent.slug)}
                                </pre>
                                <div className="group absolute right-2 top-2">
                                  <button
                                    onClick={() => copyToClipboard(getEmbedSnippet(agent.slug), agent.id)}
                                    className="rounded p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    aria-label={copiedAgentId === agent.id ? "Copied!" : "Copy to clipboard"}
                                  >
                                    {copiedAgentId === agent.id ? (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-green-600 dark:text-green-400"
                                      >
                                        <path d="M20 6 9 17l-5-5" />
                                      </svg>
                                    ) : (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                                        <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                                        <path d="M16 4h2a2 2 0 0 1 2 2v4" />
                                        <path d="M21 14H11" />
                                        <path d="m15 10-4 4 4 4" />
                                      </svg>
                                    )}
                                  </button>
                                  <div className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-slate-100 dark:text-slate-900">
                                    {copiedAgentId === agent.id ? "Copied!" : "Copy to clipboard"}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tenants Tab */}
        {activeTab === "tenants" && (
          <div>
            {/* Tenants Tab Header */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleCreateTenant}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                + New Tenant
              </button>
            </div>

            {/* Tenants List */}
            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-slate-800">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Tenant Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Agents
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  {/* General Purpose Row */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTenantClick("general")}
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        General Purpose
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {agents.filter((a) => !a.tenantId).length}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-400 dark:text-slate-500">
                      -
                    </td>
                  </tr>

                  {/* Tenant Rows */}
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTenantClick(tenant.id)}
                          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {tenant.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {tenant.agentCount}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => handleEditTenant(tenant)}
                          className="mr-2 text-slate-600 hover:underline dark:text-slate-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(tenant)}
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
          </div>
        )}
      </div>

      {/* Modals */}
      <AgentModal
        isOpen={isAgentModalOpen}
        agent={editingAgent}
        tenants={tenants}
        onSave={handleSaveAgent}
        onClose={() => setIsAgentModalOpen(false)}
      />

      <TenantModal
        isOpen={isTenantModalOpen}
        tenant={editingTenant}
        onSave={handleSaveTenant}
        onClose={() => setIsTenantModalOpen(false)}
      />

      {deletingTenant && (
        <DeleteTenantDialog
          isOpen={isDeleteDialogOpen}
          tenant={deletingTenant}
          tenants={tenants}
          onDelete={handleConfirmDeleteTenant}
          onClose={() => setIsDeleteDialogOpen(false)}
        />
      )}
    </div>
  );
}
