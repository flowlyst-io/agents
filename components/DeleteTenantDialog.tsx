"use client";

import { useState } from "react";
import type { Tenant } from "@/lib/db/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeleteTenantDialogProps {
  isOpen: boolean;
  tenant: Tenant & { agentCount: number };
  tenants: Tenant[]; // Other tenants for reassignment
  onDelete: (action: "make_general" | "reassign" | "delete_agents", targetTenantId?: string) => Promise<void>;
  onClose: () => void;
}

export function DeleteTenantDialog({
  isOpen,
  tenant,
  tenants,
  onDelete,
  onClose,
}: DeleteTenantDialogProps) {
  const [action, setAction] = useState<"make_general" | "reassign" | "delete_agents">("make_general");
  const [targetTenantId, setTargetTenantId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out the tenant being deleted from reassignment options
  const otherTenants = tenants.filter((t) => t.id !== tenant.id);

  const handleDelete = async () => {
    setError(null);

    // Validate reassign action
    if (action === "reassign" && !targetTenantId) {
      setError("Please select a tenant to reassign agents to");
      return;
    }

    setIsSubmitting(true);

    try {
      await onDelete(action, action === "reassign" ? targetTenantId : undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{tenant.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This tenant has <strong>{tenant.agentCount} agent{tenant.agentCount !== 1 ? "s" : ""}</strong> assigned.
            What should happen to them?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <RadioGroup value={action} onValueChange={(value) => setAction(value as typeof action)}>
            {/* Option 1: Make General Purpose */}
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="make_general" id="make_general" />
              <Label htmlFor="make_general" className="flex-1 cursor-pointer">
                <div className="font-medium">Make them General Purpose</div>
                <div className="text-sm text-muted-foreground">
                  Agents will remain in the system without a tenant
                </div>
              </Label>
            </div>

            {/* Option 2: Reassign to Another Tenant */}
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="reassign" id="reassign" />
              <Label htmlFor="reassign" className="flex-1 cursor-pointer">
                <div className="font-medium">Reassign to another tenant</div>
                {action === "reassign" && (
                  <div className="mt-2">
                    <Select value={targetTenantId} onValueChange={setTargetTenantId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {otherTenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </Label>
            </div>

            {/* Option 3: Delete All Agents */}
            <div className="flex items-start space-x-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <RadioGroupItem value="delete_agents" id="delete_agents" />
              <Label htmlFor="delete_agents" className="flex-1 cursor-pointer">
                <div className="font-medium text-destructive">Delete all agents too</div>
                <div className="text-sm text-destructive/80">
                  ⚠️ This will permanently delete {tenant.agentCount} agent{tenant.agentCount !== 1 ? "s" : ""}
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? "Deleting..." : "Delete Tenant"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
