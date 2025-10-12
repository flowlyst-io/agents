"use client";

import { useState, useEffect } from "react";
import type { Agent } from "@/lib/db/schema";

interface AgentModalProps {
  isOpen: boolean;
  agent: Agent | null; // null = create mode, object = edit mode
  onSave: (data: {
    name: string;
    workflowId: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function AgentModal({ isOpen, agent, onSave, onClose }: AgentModalProps) {
  const [name, setName] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setWorkflowId(agent.workflowId);
    } else {
      setName("");
      setWorkflowId("");
    }
    setError(null);
  }, [agent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave({ name, workflowId });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
          {agent ? "Edit Agent" : "Create New Agent"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              placeholder="Support Agent"
            />
          </div>

          {/* Workflow ID Field */}
          <div className="mb-4">
            <label
              htmlFor="workflowId"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Workflow ID
            </label>
            <input
              type="text"
              id="workflowId"
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              required
              className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              placeholder="wf_abc123xyz"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              OpenAI Agent Builder workflow ID
            </p>
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
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
