'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

const TaskContext = createContext(null);

const CACHE_KEY = 'mineral_tasks';

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);

  const COLUMNS = [
    { id: 'not_started',    label: 'Not Started',    dotColor: 'bg-neutral-400', borderColor: 'border-l-neutral-400' },
    { id: 'ready_to_start', label: 'Ready to Start', dotColor: 'bg-blue-500',    borderColor: 'border-l-blue-500'    },
    { id: 'in_progress',    label: 'In Progress',    dotColor: 'bg-amber-500',   borderColor: 'border-l-amber-500'   },
    { id: 'in_review',      label: 'In Review',      dotColor: 'bg-purple-500',  borderColor: 'border-l-purple-500'  },
    { id: 'completed',      label: 'Completed',      dotColor: 'bg-emerald-600', borderColor: 'border-l-emerald-600' },
  ];

  const refresh = useCallback(async () => {
    try {
      const data = await api.list();
      const fresh = data.data || [];
      setTasks(fresh);
      localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
    } catch (err) {
      console.error('Failed to refresh tasks:', err);
    }
  }, []);

  // Load on mount: show cache immediately, fetch in background to update
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setTasks(JSON.parse(cached));
      } catch {
        // ignore parse errors
      }
    }
    refresh();
  }, [refresh]);

  const addTask = useCallback(async (taskData) => {
    const result = await api.create(taskData);
    setTasks(prev => [result.data, ...prev]);
    const cached = localStorage.getItem(CACHE_KEY);
    try {
      const current = JSON.parse(cached);
      localStorage.setItem(CACHE_KEY, JSON.stringify([result.data, ...current]));
    } catch { /* ignore */ }
    return result.data;
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    await api.update(id, updates);
    setTasks(prev => prev.map(t => t.id == id ? { ...t, ...updates } : t));
    const cached = localStorage.getItem(CACHE_KEY);
    try {
      const current = JSON.parse(cached);
      localStorage.setItem(CACHE_KEY, JSON.stringify(
        current.map(t => t.id == id ? { ...t, ...updates } : t)
      ));
    } catch { /* ignore */ }
  }, []);

  const deleteTask = useCallback(async (id) => {
    await api.delete(id);
    setTasks(prev => prev.filter(t => t.id != id));
    const cached = localStorage.getItem(CACHE_KEY);
    try {
      const current = JSON.parse(cached);
      localStorage.setItem(CACHE_KEY, JSON.stringify(current.filter(t => t.id != id)));
    } catch { /* ignore */ }
  }, []);

  const moveTask = useCallback(async (taskId, newStatus, newOrder) => {
    setTasks(prev => {
      const others = prev.filter(t => t.id != taskId);
      const task = prev.find(t => t.id == taskId);
      if (!task) return prev;
      const updated = { ...task, status: newStatus, order: newOrder };
      
      if (newStatus !== 'completed') {
        const inDest = others.filter(t => t.status === newStatus);
        const elsewhere = others.filter(t => t.status !== newStatus);
        inDest.splice(newOrder, 0, updated);
        return [...elsewhere, ...inDest];
      }
      
      return [...others, updated];
    });
    await api.update(taskId, { status: newStatus });
  }, []);

  const value = { tasks, COLUMNS, refresh, addTask, updateTask, deleteTask, moveTask };
  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be inside TaskProvider');
  return ctx;
};
