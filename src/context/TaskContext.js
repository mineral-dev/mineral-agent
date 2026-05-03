'use client';
import { createContext, useContext, useCallback } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { TASK_COLUMNS } from '@/lib/tasks';

const TaskContext = createContext(null);
const TASKS_KEY = 'tasks';

async function fetchTasks() {
  const result = await api.list();
  return result.data || [];
}

export function TaskProvider({ children }) {
  const { data, error, isLoading, mutate } = useSWR(TASKS_KEY, fetchTasks, {
    revalidateOnFocus: true,
    keepPreviousData: true,
  });

  const tasks = data || [];
  const loading = isLoading && !data;

  const refresh = useCallback(() => mutate(), [mutate]);

  const addTask = useCallback(async (taskData) => {
    const result = await api.create(taskData);
    const created = result.data;
    await mutate((current = []) => [created, ...current], {
      revalidate: false,
      populateCache: true,
    });
    return created;
  }, [mutate]);

  const updateTask = useCallback(async (id, updates) => {
    const result = await api.update(id, updates);
    const updated = result.data;
    await mutate((current = []) => current.map((task) => (
      Number(task.id) === Number(id) ? { ...task, ...updated } : task
    )), {
      revalidate: false,
      populateCache: true,
    });
    return updated;
  }, [mutate]);

  const deleteTask = useCallback(async (id) => {
    await api.delete(id);
    await mutate((current = []) => current.filter((task) => Number(task.id) !== Number(id)), {
      revalidate: false,
      populateCache: true,
    });
  }, [mutate]);

  const moveTask = useCallback(async (taskId, newStatus, newOrder, reason, note) => {
    await mutate((current = []) => current.map((task) =>
      Number(task.id) === Number(taskId)
        ? { ...task, status: newStatus, order: newOrder }
        : task
    ), { revalidate: false, populateCache: true });

    const result = await api.move(taskId, {
      status: newStatus,
      order: newOrder,
      backToReadyReason: reason,
      backToReadyNote: note,
    });

    if (Array.isArray(result.tasks)) {
      await mutate(result.tasks, {
        revalidate: false,
        populateCache: true,
      });
      return result.data;
    }

    await mutate();
    return result.data;
  }, [mutate]);

  const value = {
    tasks,
    loading,
    error,
    COLUMNS: TASK_COLUMNS,
    refresh,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be inside TaskProvider');
  return ctx;
};
