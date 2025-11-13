"use client";

import { useState, useEffect } from "react";
import type { Dashboard, Agent, Tenant } from "@/lib/db/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardAgentPicker } from "./DashboardAgentPicker";

interface DashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardId?: string | null;
  onSuccess: () => void;
}

type DashboardWithAgents = Dashboard & { agents: Agent[] };

export function DashboardModal({
  open,
  onOpenChange,
  dashboardId,
  onSuccess,
}: DashboardModalProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tenants on mount
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch("/api/tenants");
        if (response.ok) {
          const data = await response.json();
          setTenants(data);
        }
      } catch (error) {
        console.error("Failed to fetch tenants:", error);
      }
    };

    if (open) {
      fetchTenants();
    }
  }, [open]);

  // Fetch dashboard data if editing
  useEffect(() => {
    const fetchDashboard = async () => {
      if (!dashboardId) {
        // Reset form for create mode
        setTitle("");
        setSlug("");
        setSelectedTenantId(null);
        setInputValue("");
        setSelectedAgents([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/dashboards/${dashboardId}`);
        if (response.ok) {
          const dashboard: DashboardWithAgents = await response.json();
          setTitle(dashboard.title);
          setSlug(dashboard.slug);
          setSelectedTenantId(dashboard.tenantId);
          setSelectedAgents(dashboard.agents || []);

          // Set display value for tenant
          if (dashboard.tenantId) {
            const tenant = tenants.find((t) => t.id === dashboard.tenantId);
            setInputValue(tenant ? tenant.name : "");
          } else {
            setInputValue("");
          }
        } else {
          setError("Failed to fetch dashboard");
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
        setError("Failed to fetch dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchDashboard();
    }
  }, [dashboardId, open, tenants]);

  const handleSelectTenant = (tenantId: string | null) => {
    setSelectedTenantId(tenantId);
    if (tenantId) {
      const tenant = tenants.find((t) => t.id === tenantId);
      setInputValue(tenant ? tenant.name : "");
    } else {
      setInputValue("");
    }
    setPopoverOpen(false);
  };

  const getTenantDisplayValue = () => {
    if (selectedTenantId) {
      const tenant = tenants.find((t) => t.id === selectedTenantId);
      return tenant ? tenant.name : "Unknown";
    }
    if (inputValue) {
      return inputValue; // New tenant being created
    }
    return "General Purpose";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let finalTenantId = selectedTenantId;

      // If user typed a new tenant name, create it first
      if (!selectedTenantId && inputValue.trim()) {
        const createTenantRes = await fetch("/api/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: inputValue.trim() }),
        });

        if (!createTenantRes.ok) {
          const error = await createTenantRes.json();
          throw new Error(error.error || "Failed to create tenant");
        }

        const newTenant = await createTenantRes.json();
        finalTenantId = newTenant.id;
      }

      if (dashboardId) {
        // Update existing dashboard
        const updateResponse = await fetch(`/api/dashboards/${dashboardId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            tenantId: finalTenantId,
          }),
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          throw new Error(error.error || "Failed to update dashboard");
        }

        // Update agents - fetch original agents to calculate diff
        const dashboardResponse = await fetch(`/api/dashboards/${dashboardId}`);
        if (!dashboardResponse.ok) {
          throw new Error("Failed to fetch original dashboard");
        }
        const originalDashboard: DashboardWithAgents = await dashboardResponse.json();
        const originalAgentIds = (originalDashboard.agents || []).map((a) => a.id);
        const currentAgentIds = selectedAgents.map((a) => a.id);

        // Calculate agents to remove and add
        const toRemove = originalAgentIds.filter(id => !currentAgentIds.includes(id));
        const toAdd = currentAgentIds.filter(id => !originalAgentIds.includes(id));

        // Remove agents that were deselected
        if (toRemove.length > 0) {
          const removeResponse = await fetch(`/api/dashboards/${dashboardId}/agents`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agentIds: toRemove }),
          });

          if (!removeResponse.ok) {
            const error = await removeResponse.json();
            throw new Error(error.error || "Failed to remove agents");
          }
        }

        // Add new agents that were selected
        if (toAdd.length > 0) {
          const addResponse = await fetch(`/api/dashboards/${dashboardId}/agents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agentIds: toAdd }),
          });

          if (!addResponse.ok) {
            const error = await addResponse.json();
            throw new Error(error.error || "Failed to add agents");
          }
        }
      } else {
        // Create new dashboard
        const createResponse = await fetch("/api/dashboards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            tenantId: finalTenantId,
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(error.error || "Failed to create dashboard");
        }

        const newDashboard = await createResponse.json();

        // Add agents to the new dashboard
        if (selectedAgents.length > 0) {
          const agentIds = selectedAgents.map((a) => a.id);
          const agentsResponse = await fetch(`/api/dashboards/${newDashboard.id}/agents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agentIds }),
          });

          if (!agentsResponse.ok) {
            const error = await agentsResponse.json();
            throw new Error(error.error || "Failed to add agents");
          }
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dashboardId ? "Edit Dashboard" : "Create New Dashboard"}</DialogTitle>
          <DialogDescription>
            {dashboardId
              ? "Update dashboard details and agent assignments below."
              : "Enter details for the new dashboard."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Support Dashboard"
                  required
                />
              </div>

              {/* Slug Field (read-only in edit mode) */}
              {dashboardId && slug && (
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={slug} disabled className="bg-slate-100 dark:bg-slate-800" />
                  <p className="text-xs text-muted-foreground">Slug cannot be changed after creation</p>
                </div>
              )}

              {/* Tenant Combobox */}
              <div className="space-y-2">
                <Label>Tenant (Optional)</Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="w-full justify-between"
                    >
                      {getTenantDisplayValue()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search or type new tenant..."
                        value={inputValue}
                        onValueChange={setInputValue}
                      />
                      <CommandList>
                        <CommandEmpty>Create &quot;{inputValue}&quot;</CommandEmpty>
                        <CommandGroup>
                          {/* General Purpose Option */}
                          <CommandItem
                            onSelect={() => {
                              handleSelectTenant(null);
                              setInputValue("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !selectedTenantId && !inputValue ? "opacity-100" : "opacity-0"
                              )}
                            />
                            General Purpose
                          </CommandItem>

                          {/* Existing Tenants */}
                          {tenants.map((tenant) => (
                            <CommandItem
                              key={tenant.id}
                              value={tenant.name}
                              onSelect={() => handleSelectTenant(tenant.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedTenantId === tenant.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {tenant.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Select existing or type new tenant name to create
                </p>
              </div>

              {/* Agent Picker */}
              <DashboardAgentPicker
                selectedAgents={selectedAgents}
                onAgentsChange={setSelectedAgents}
                defaultTenantId={selectedTenantId}
              />

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
