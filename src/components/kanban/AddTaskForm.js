"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { TaskFormFields } from "./task-fields";

const defaultForm = {
  title: "",
  description: "",
  priority: "normal",
  project: "",
};

export function AddTaskForm({ open, onOpenChange, onAdd }) {
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(async () => {
    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({ ...form, status: "not_started" });
      setForm(defaultForm);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "Unable to create the task.");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isSubmitting, onAdd, onOpenChange]);

  const cancel = () => {
    setForm(defaultForm);
    setError(null);
    onOpenChange(false);
  };

  const footer = (
    <div className="flex flex-col-reverse gap-3 p-4 pt-4 sm:flex-row sm:p-0">
      <Button
        variant="outline"
        onClick={cancel}
        disabled={isSubmitting}
        className="h-11 flex-1"
      >
        Cancel
      </Button>
      <Button
        onClick={submit}
        disabled={!form.title.trim() || isSubmitting}
        className="h-11 flex-1 gap-2"
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner size="sm" />
            Creating task
          </>
        ) : (
          "Create task"
        )}
      </Button>
    </div>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create task"
      description="Add the task, its context, and a priority so the agent can pick it up."
      footer={footer}
      desktopClassName="sm:max-w-xl p-6 gap-4"
      desktopBodyClassName="space-y-6"
      mobileClassName="rounded-t-2xl p-0 gap-0"
      mobileBodyClassName="pb-6 pt-4"
    >
      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <TaskFormFields
        form={form}
        setForm={setForm}
        titleRequired
        onSubmit={submit}
        titlePlaceholder="What should the agent do?"
        descriptionPlaceholder="Context, links, or implementation notes"
        projectPlaceholder="owner/repo-name"
      />
    </ResponsiveModal>
  );
}
