# Mineral Agent — Enhancement Plan
**Date:** 2026-05-03
**Status:** Draft
**Repo:** https://github.com/mineral-dev/mineral-agent

---

## Overview

Three targeted enhancements for the Kanban board:

1. Fix "Create Task" not working (root cause analysis + fix)
2. Responsive task creation: `Sheet` on mobile, `Dialog` on desktop
3. Apple Human Interface Guidelines (HIG) for mobile buttons

---

## 1. Fix: Create Task Not Working

### Root Cause

The `AddTaskForm → TaskContext → API → db.js` POST chain is structurally correct, but two issues likely prevent task creation:

**Issue A: `status` double-passed through the chain**
```
AddTaskForm.submit():  onAdd({ ...form, status: 'not_started' })
                      ↑ form already has status: 'normal' from defaultForm
TaskContext.addTask(): api.create({ ...taskData, status: 'not_started', order: 0 })
                      ↑ double-sets status (harmless but messy)
```
Not a crash, but indicates the flow wasn't tested end-to-end.

**Issue B: No error handling in AddTaskForm**
If `api.create()` throws (e.g. JSON parse error, network failure), the form silently fails. The `submit()` function has no try/catch and no user feedback.

**Issue C: dev server not running**
The dev server (`pnpm dev`) was started at some point but may have stopped. The app on Vercel has no persistent filesystem — `data/tasks.json` can't be written on the serverless Vercel edge.

### Fix Plan

**File: `src/components/kanban/AddTaskForm.js`**
- Add `useCallback` for `submit` with try/catch
- Add loading state (`isSubmitting`) to disable button and show spinner during API call
- On error: show inline error message below form
- Remove redundant `status: 'not_started'` from `submit()` — let TaskContext own that

**File: `src/context/TaskContext.js`**
- `addTask`: remove redundant `status: 'not_started'` (it's already in `defaultForm` and gets passed through)
- `addTask`: return the created task so caller can handle errors
- Add error state to TaskContext (optional — or handle in component)

**File: `src/lib/api.js`**
- `create`: return full response including error field, don't throw on non-2xx

**File: `src/app/api/tasks/route.js`**
- Add `console.error` for server-side errors so they're visible in Vercel function logs
- Wrap `create()` call in try/catch with proper error logging

**File: `src/lib/db.js`**
- Remove the `console.error('DEBUG update:...')` debug line — pollutes logs
- Add try/catch in `create()` with logging

**Deployment note:** `data/tasks.json` is a local file that won't persist on Vercel serverless. This is a known limitation. For Vercel deployment, either:
- (A) Switch to Vercel Postgres / KV storage
- (B) Keep tasks in-memory (resets on cold start — only fine for dev)
- (C) Use a third-party API (e.g. a free Airtable base)

For this fix: mark as **dev-only** in the UI with a note. Vercel deployment will need a database upgrade.

---

## 2. Feature: Sheet (Mobile) / Dialog (Desktop) for Task Creation

### Root Cause

`AddTaskForm.js` only renders a `Dialog` — no mobile-aware component. shadcn's `Sheet` component is available in the shadcn registry but not yet installed in the project.

### Design

- **Mobile (< 768px):** `Sheet` slides up from bottom (mobile native pattern)
- **Desktop (≥ 768px):** `Dialog` centered modal
- Use `window.matchMedia` or a `useMediaQuery` hook to detect breakpoint
- The form component (`<TaskFormInner>`) is shared — only the wrapper differs

### shadcn Component: Sheet

Install via shadcn CLI:
```bash
cd /Users/andy/Project/mineral-agent && npx shadcn@latest add sheet --defaults --force
```

This installs `src/components/ui/sheet.jsx` with:
- `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`, `SheetTrigger`

### File: `src/hooks/useMediaQuery.js` (NEW)
```javascript
'use client';
import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    setMatches(m.matches);
    const handler = (e) => setMatches(e.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
```

### File: `src/components/kanban/AddTaskForm.js` (MODIFY)

Structure:
```javascript
'use client';
import { useState, useCallback } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
// ... other imports

const isDesktop = useMediaQuery('(min-width: 768px)');

// Form inner (shared):
function TaskFormInner({ form, setForm, onSubmit, onCancel, isSubmitting }) {
  return (
    <>
      <div className="space-y-3 py-2">
        <Input placeholder="Task title *" value={form.title} ... autoFocus />
        <Textarea placeholder="Description (optional)" value={form.description} ... />
        <Select value={form.priority} ...>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Project (optional)" value={form.project} ... />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSubmit} disabled={!form.title.trim() || isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create Task'}
        </Button>
      </DialogFooter>
    </>
  );
}

// Desktop: Dialog wrapper
{isDesktop ? (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
      <TaskFormInner form={form} setForm={setForm} onSubmit={submit} onCancel={cancel} isSubmitting={isSubmitting} />
    </DialogContent>
  </Dialog>
) : (
  // Mobile: Sheet slides up from bottom
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="rounded-t-2xl">
      <SheetHeader>
        <SheetTitle>New Task</SheetTitle>
      </SheetHeader>
      <TaskFormInner form={form} setForm={setForm} onSubmit={submit} onCancel={cancel} isSubmitting={isSubmitting} />
    </SheetContent>
  </Sheet>
)}
```

**Key Sheet props:**
- `side="bottom"` — slides up from bottom (iOS native sheet pattern)
- `className="rounded-t-2xl"` — iOS-style top corner radius
- Sheet overlay closes on tap outside

### File: `src/app/page.js` (MODIFY)
- No changes needed — still passes `dialogOpen`, `setDialogOpen`, `addTask` to `AddTaskForm`

---

## 3. Apple HIG Mobile Button Design

### Current Problems

1. **Touch target too small** — buttons are ~36px tall, Apple HIG requires **44×44pt minimum**
2. **Padding inconsistent** — no explicit horizontal padding
3. **Border radius too small** — current uses `radius-md` (~10px), Apple HIG uses 22px for large action buttons
4. **No clear active/pressed state** — opacity change is too subtle
5. **Font weight too light** — needs semibold for labels

### Apple HIG Principles Applied

| Principle | Implementation |
|-----------|---------------|
| Minimum 44×44pt touch target | `min-h-11 min-w-11` (44px) on all buttons |
| Generous horizontal padding | `px-5` (20px) for comfortable tap |
| Clear pressed state | `active:scale-95` + `active:bg-primary/90` — scale down + darken |
| Large corner radius | `rounded-full` for pill buttons, `rounded-2xl` for action buttons |
| Semibold labels | `font-semibold` on all button text |
| Full-width on mobile | Primary action button `w-full` on mobile |
| Generous spacing between buttons | `gap-3` between adjacent buttons |
| Haptic-like feedback (visual) | Subtle shadow on hover, lift on active |

### Files to Modify

**`src/components/ui/button.jsx`**

The shadcn button component is the base — modify its variants:

```javascript
// Current variant classes to override:
// default: bg-primary text-primary-foreground hover:bg-primary/90
//         ↓ change to:
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-150",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:bg-primary/90 active:scale-95 active:bg-primary/80",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:shadow-md active:scale-95",
        outline:
          "border border-border bg-transparent hover:bg-accent active:scale-95 rounded-2xl",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95 rounded-2xl",
        ghost:
          "hover:bg-accent active:scale-95 rounded-xl",
        link:
          "text-primary underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-11 px-5 py-2 min-w-11",        // 44px tall, 20px horizontal
        sm: "h-9 px-4 rounded-xl text-sm",
        lg: "h-12 px-6 rounded-2xl text-base",      // 48px tall for primary CTAs
        icon: "h-11 w-11 rounded-xl",               // 44×44 square for icon-only
      },
    },
    defaultVariants: {
      default: "default",
      size: "default",
    },
  }
);
```

**`src/app/page.js`**

The "Add Task" button in the header should be a pill-style button on mobile:
```javascript
// Desktop: icon + text
<Button onClick={() => setDialogOpen(true)} size="default">
  <Plus className="w-4 h-4 mr-1" /> Add Task
</Button>

// Mobile: consider a floating action button (FAB) in bottom-right corner
// instead of header button — standard iOS pattern
```

**Better mobile approach: Floating Action Button (FAB)**

On mobile, move "Add Task" from header to a **floating action button** bottom-right, above safe area:

```javascript
// In page.js Board component:
const isDesktop = useMediaQuery('(min-width: 768px)');

// Header: only show Add Task on desktop
{isDesktop && (
  <Button onClick={() => setDialogOpen(true)}>
    <Plus className="w-4 h-4 mr-1" /> Add Task
  </Button>
)}

// Mobile: FAB in bottom-right corner
{!isDesktop && (
  <button
    onClick={() => setDialogOpen(true)}
    className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg active:scale-95 flex items-center justify-center"
    aria-label="Add new task"
  >
    <Plus className="w-6 h-6" />
  </button>
)}
```

**`src/components/kanban/TaskCard.js`**

The card's `...` dropdown trigger should also be 44×44px on touch:
```javascript
// Current: small icon button
// Fix:
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl -mt-1 -mr-1">
    <MoreHorizontal className="w-4 h-4" />
  </Button>
</DropdownMenuTrigger>
```

---

## Task Checklist

- [ ] **1.1** Install shadcn `sheet` component
- [ ] **1.2** Create `src/hooks/useMediaQuery.js`
- [ ] **1.3** Rewrite `AddTaskForm.js` with Dialog/Sheet responsive wrapper + error handling
- [ ] **1.4** Fix `TaskContext.addTask` — remove redundant status passthrough
- [ ] **1.5** Add error logging to `route.js` POST handler
- [ ] **1.6** Remove debug `console.error` from `db.js`
- [ ] **2.1** Modify `button.jsx` variants for Apple HIG compliance
- [ ] **2.2** Add FAB (floating action button) to `page.js` for mobile
- [ ] **2.3** Enlarge `TaskCard` dropdown trigger to 44×44px
- [ ] **3.1** Run `pnpm build` and verify clean build
- [ ] **3.2** Test create task flow manually (dev server)
- [ ] **3.3** Commit and push
- [ ] **3.4** Redeploy on Vercel (note: tasks won't persist — dev only)

---

## Tech Notes

- **Sheet component:** shadcn v4 uses Radix UI primitives under the hood — `Sheet` is a side-drawer variant of Dialog
- **breakpoint:** 768px (md in Tailwind) is the standard tablet/desktop split
- **Vercel deployment:** After this fix, tasks created locally (dev) will work. Vercel deployment needs a database. Add a `data/tasks.json` note banner in the UI if deployed to Vercel
- **Apple HIG touch targets:** 44×44pt = 44×44px at 1x scale. For high-DPI: still 44px (not 88px). The `min-h-11 min-w-11` Tailwind classes give exactly 44px at default font size
- **Active state:** `active:scale-95` gives the "pressed" feel without being jarring
- **Font:** Geist Sans already loaded — `font-semibold` on buttons matches Vercel's own UI

---

## File Inventory

| File | Action |
|------|--------|
| `src/hooks/useMediaQuery.js` | **CREATE** — media query hook |
| `src/components/ui/sheet.jsx` | **CREATE** — via `npx shadcn add sheet` |
| `src/components/kanban/AddTaskForm.js` | **MODIFY** — responsive Dialog/Sheet + error handling |
| `src/components/ui/button.jsx` | **MODIFY** — Apple HIG sizing and states |
| `src/components/kanban/TaskCard.js` | **MODIFY** — 44×44 touch target for dropdown |
| `src/app/page.js` | **MODIFY** — desktop-only header button + mobile FAB |
| `src/context/TaskContext.js` | **MODIFY** — clean up redundant status passthrough |
| `src/app/api/tasks/route.js` | **MODIFY** — add error logging |
| `src/lib/db.js` | **MODIFY** — remove debug line, add error logging |
| `src/lib/api.js` | **MODIFY** — return error field instead of throwing |
