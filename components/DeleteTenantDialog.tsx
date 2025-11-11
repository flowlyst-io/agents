"use client";

import { useState } from "react";
import type { Tenant } from "@/lib/db/schema";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
          Delete "{tenant.name}"?
        </h2>

        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          This tenant has <strong>{tenant.agentCount} agent{tenant.agentCount !== 1 ? "s" : ""}</strong> assigned.
          What should happen to them?
        </p>

        <form onSubmit={handleSubmit}>
          {/* Radio Options */}
          <div className="mb-4 space-y-3">
            {/* Option 1: Make General Purpose */}
            <label className="flex cursor-pointer items-start gap-3 rounded border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">
              <input
                type="radio"
                name="action"
                value="make_general"
                checked={action === "make_general"}
                onChange={(e) => setAction(e.target.value as "make_general")}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-white">
                  Make them General Purpose
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Agents will remain in the system without a tenant
                </div>
              </div>
            </label>

            {/* Option 2: Reassign to Another Tenant */}
            <label className="flex cursor-pointer items-start gap-3 rounded border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">
              <input
                type="radio"
                name="action"
                value="reassign"
                checked={action === "reassign"}
                onChange={(e) => setAction(e.target.value as "reassign")}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-white">
                  Reassign to another tenant
                </div>
                {action === "reassign" && (
                  <select
                    value={targetTenantId}
                    onChange={(e) => setTargetTenantId(e.target.value)}
                    className="mt-2 w-full rounded border border-slate-300 px-3 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    required
                  >
                    <option value="">Select tenant...</option>
                    {otherTenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </label>

            {/* Option 3: Delete All Agents */}
            <label className="flex cursor-pointer items-start gap-3 rounded border border-red-200 p-3 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20">
              <input
                type="radio"
                name="action"
                value="delete_agents"
                checked={action === "delete_agents"}
                onChange={(e) => setAction(e.target.value as "delete_agents")}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-red-700 dark:text-red-400">
                  Delete all agents too
                </div>
                <div className="text-xs text-red-600 dark:text-red-500">
                  ⚠️ This will permanently delete {tenant.agentCount} agent{tenant.agentCount !== 1 ? "s" : ""}
                </div>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded bg-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? "Deleting..." : "Delete Tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
