"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Plus, X, Zap } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const defaultForm = {
  title: "",
  description: "",
  priority: "normal",
  project: "",
};

const PRIORITIES = [
  { value: "high", label: "High", dot: "bg-red-500" },
  { value: "normal", label: "Normal", dot: "bg-muted-foreground/50" },
  { value: "low", label: "Low", dot: "bg-blue-400" },
];

function TaskFormInner({ form, setForm, onSubmit, error }) {
  const handlePriorityChange = (value) => {
    setForm((f) => ({ ...f, priority: value }));
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
          {error}
        </div>
      )}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Title *
        </label>
        <Input
          placeholder="What needs to be done?"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          onKeyDown={(e) =>
            e.key === "Enter" && form.title.trim() && onSubmit()
          }
          autoFocus
          className="h-11"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Description
        </label>
        <Textarea
          placeholder="Notes, links, or context..."
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={3}
          className="resize-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Priority
        </label>
        <div className="flex rounded-xl border border-border overflow-hidden">
          {PRIORITIES.map((p) => {
            const active = form.priority === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePriorityChange(p.value)}
                className={`flex-1 flex items-center justify-center gap-2 h-11 text-sm font-medium transition-colors border-r last:border-r-0 border-border
                  ${
                    active
                      ? p.value === "high"
                        ? "bg-red-500 text-white border-red-500"
                        : p.value === "low"
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-foreground text-background"
                      : "bg-background text-muted-foreground hover:bg-muted/40"
                  }`}
              >
                {p.value === "high" ? (
                  <Zap
                    className={`w-3.5 h-3.5 ${active ? "text-white" : "text-red-500"}`}
                  />
                ) : (
                  <span
                    className={`w-2 h-2 rounded-full ${active ? "bg-background/60" : p.dot}`}
                  />
                )}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Project
        </label>
        <Input
          placeholder="mineral-dev/repo-name (optional)"
          value={form.project}
          onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
          className="h-11 font-mono"
        />
      </div>
    </div>
  );
}

function AgentSparkLoader() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="block w-[5px] h-[5px] bg-current"
          style={{
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            animation: `agent-spark 1s ease-in-out ${i * 0.14}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function FormButtons({ onCancel, onSubmit, isSubmitting, titleEmpty }) {
  return (
    <>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="flex-1 h-11"
      >
        Cancel
      </Button>
      <Button
        onClick={onSubmit}
        disabled={titleEmpty || isSubmitting}
        className="flex-1 h-11 gap-2"
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner />
            Creating
          </>
        ) : (
          "Create Task"
        )}
      </Button>
    </>
  );
}

export function AddTaskForm({ open, onOpenChange, onAdd }) {
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const submit = useCallback(async () => {
    if (!form.title.trim()) {
      setError("Title is required");
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
      setError(err.message || "Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isSubmitting, onAdd, onOpenChange]);

  const cancel = () => {
    setForm(defaultForm);
    setError(null);
    onOpenChange(false);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl p-6 gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg">Create New Task</DialogTitle>
            <DialogDescription className="text-sm">
              Fill in the details below and set a priority.
            </DialogDescription>
          </DialogHeader>
          <TaskFormInner
            form={form}
            setForm={setForm}
            onSubmit={submit}
            error={error}
          />
          <DialogFooter className="flex-row gap-3">
            <FormButtons
              onCancel={cancel}
              onSubmit={submit}
              isSubmitting={isSubmitting}
              titleEmpty={!form.title.trim()}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-6 pt-4 rounded-t-2xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">New Task</SheetTitle>
          </div>
          <SheetDescription className="text-sm">
            Fill in the details below and set a priority.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <TaskFormInner
            form={form}
            setForm={setForm}
            onSubmit={submit}
            error={error}
          />
        </div>
        <SheetFooter className="flex-row gap-3 pt-4">
          <FormButtons
            onCancel={cancel}
            onSubmit={submit}
            isSubmitting={isSubmitting}
            titleEmpty={!form.title.trim()}
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
