"use client";

import { useState, useEffect } from "react";
import type { Agent, Tenant } from "@/lib/db/schema";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface DashboardAgentPickerProps {
  selectedAgents: Agent[];
  onAgentsChange: (agents: Agent[]) => void;
  defaultTenantId?: string | null;
}

export function DashboardAgentPicker({
  selectedAgents,
  onAgentsChange,
  defaultTenantId,
}: DashboardAgentPickerProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantFilter, setTenantFilter] = useState<string>(defaultTenantId || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch agents and tenants on mount
  useEffect(() => {
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

    fetchData();
  }, []);

  // Update tenant filter when defaultTenantId changes
  useEffect(() => {
    if (defaultTenantId) {
      setTenantFilter(defaultTenantId);
    }
  }, [defaultTenantId]);

  // Filter agents by tenant and search query
  const filteredAgents = agents.filter((agent) => {
    // Filter by tenant
    const matchesTenant =
      tenantFilter === "all" ||
      (tenantFilter === "general" && agent.tenantId === null) ||
      agent.tenantId === tenantFilter;

    // Filter by search query
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Exclude already selected agents
    const notSelected = !selectedAgents.some((selected) => selected.id === agent.id);

    return matchesTenant && matchesSearch && notSelected;
  });

  const handleSelectAgent = (agent: Agent) => {
    onAgentsChange([...selectedAgents, agent]);
    setSearchQuery("");
  };

  const handleRemoveAgent = (agentId: string) => {
    onAgentsChange(selectedAgents.filter((agent) => agent.id !== agentId));
  };

  const getTenantName = (tenantId: string | null): string => {
    if (!tenantId) return "General Purpose";
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : "Unknown";
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Agents</Label>
        <div className="text-sm text-muted-foreground">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label>Agents</Label>

      {/* Tenant Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by:</span>
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select tenant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenants</SelectItem>
            <SelectItem value="general">General Purpose</SelectItem>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Agents Badges */}
      {selectedAgents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAgents.map((agent) => (
            <Badge key={agent.id} variant="secondary" className="gap-1">
              {agent.name}
              <button
                type="button"
                onClick={() => handleRemoveAgent(agent.id)}
                className="ml-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Agent Search/Select */}
      <Command className="rounded-lg border">
        <CommandInput
          placeholder="Search agents..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {filteredAgents.length === 0 && agents.length > 0
              ? "No agents available (all selected or filtered out)"
              : "No agents found"}
          </CommandEmpty>
          <CommandGroup>
            {filteredAgents.map((agent) => (
              <CommandItem
                key={agent.id}
                value={agent.name}
                onSelect={() => handleSelectAgent(agent)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{agent.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getTenantName(agent.tenantId)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      <p className="text-xs text-muted-foreground">
        Search and select agents to add to this dashboard
      </p>
    </div>
  );
}
