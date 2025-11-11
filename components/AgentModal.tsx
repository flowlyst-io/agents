"use client";

import { useState, useEffect } from "react";
import type { Agent, Tenant } from "@/lib/db/schema";
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

interface AgentModalProps {
  isOpen: boolean;
  agent: Agent | null; // null = create mode, object = edit mode
  tenants: Tenant[]; // List of existing tenants
  onSave: (data: {
    name: string;
    workflowId: string;
    tenantId: string | null;
    tenantName?: string; // For inline tenant creation
  }) => Promise<void>;
  onClose: () => void;
}

export function AgentModal({ isOpen, agent, tenants, onSave, onClose }: AgentModalProps) {
  const [name, setName] = useState("");
  const [workflowId, setWorkflowId] = useState("");

  // Separate state for selected tenant ID vs display value (the bug fix!)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(""); // What user types
  const [open, setOpen] = useState(false); // Combobox open state

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setWorkflowId(agent.workflowId);
      setSelectedTenantId(agent.tenantId);

      // Set display value based on tenant ID
      if (agent.tenantId) {
        const tenant = tenants.find((t) => t.id === agent.tenantId);
        setInputValue(tenant ? tenant.name : "");
      } else {
        setInputValue("");
      }
    } else {
      setName("");
      setWorkflowId("");
      setSelectedTenantId(null);
      setInputValue("");
    }
    setError(null);
  }, [agent, isOpen, tenants]);

  const handleSelectTenant = (tenantId: string | null) => {
    setSelectedTenantId(tenantId);
    if (tenantId) {
      const tenant = tenants.find((t) => t.id === tenantId);
      setInputValue(tenant ? tenant.name : "");
    } else {
      setInputValue("");
    }
    setOpen(false);
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
      // Clear distinction between existing and new tenants
      if (selectedTenantId) {
        // User selected an existing tenant - use ID
        await onSave({ name, workflowId, tenantId: selectedTenantId });
      } else if (inputValue.trim()) {
        // User typed a new tenant name - inline creation
        await onSave({ name, workflowId, tenantId: null, tenantName: inputValue.trim() });
      } else {
        // No tenant (General Purpose)
        await onSave({ name, workflowId, tenantId: null });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{agent ? "Edit Agent" : "Create New Agent"}</DialogTitle>
          <DialogDescription>
            {agent ? "Update agent details below." : "Enter details for the new agent."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name Field */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Support Agent"
                required
              />
            </div>

            {/* Workflow ID Field */}
            <div className="grid gap-2">
              <Label htmlFor="workflowId">Workflow ID</Label>
              <Input
                id="workflowId"
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                placeholder="wf_abc123xyz"
                required
              />
              <p className="text-xs text-muted-foreground">
                OpenAI Agent Builder workflow ID
              </p>
            </div>

            {/* Tenant Combobox - THE BUG FIX */}
            <div className="grid gap-2">
              <Label>Tenant</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between"
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
                      <CommandEmpty>
                        Create "{inputValue}"
                      </CommandEmpty>
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

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
