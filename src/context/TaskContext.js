'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

const TaskContext = createContext(null);
const CACHE_KEY = 'mineral-agent-tasks-cache';

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const COLUMNS = [
    { id: 'not_started',    label: 'Not Started',    dotColor: 'bg-neutral-400', borderColor: 'border-l-neutral-400' },
    { id: 'ready_to_start', label: 'Ready to Start', dotColor: 'bg-blue-500',    borderColor: 'border-l-blue-500'    },
    { id: 'in_progress',    label: 'In Progress',    dotColor: 'bg-amber-500',   borderColor: 'border-l-amber-500'   },
    { id: 'in_review',      label: 'In Review',      dotColor: 'bg-purple-500',  borderColor: 'border-l-purple-500'  },
    { id: 'approved',       label: 'Approved',       dotColor: 'bg-sky-500',     borderColor: 'border-l-sky-500'     },
    { id: 'completed',      label: 'Completed',      dotColor: 'bg-emerald-600', borderColor: 'border-l-emerald-600' },
  ];

  const saveCache = (data) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list();
      const fresh = data.data || [];
      setTasks(fresh);
      saveCache(fresh);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tasks on mount — show cached data immediately, then refresh in background
  useEffect(() => {
    let hasCached = false;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setTasks(JSON.parse(cached));
        hasCached = true;
      }
    } catch {}

    if (!hasCached) setLoading(true);

    api.list().then((data) => {
      const fresh = data.data || [];
      setTasks(fresh);
      saveCache(fresh);
    }).finally(() => setLoading(false));
  }, []);

  const addTask = useCallback(async (taskData) => {
    const result = await api.create(taskData);
    setTasks(prev => [result.data, ...prev]);
    return result.data;
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    await api.update(id, updates);
      setTasks(prev => prev.map(t => t.id == id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback(async (id) => {
    await api.delete(id);
    setTasks(prev => prev.filter(t => t.id != id));
  }, []);

  const moveTask = useCallback(async (taskId, newStatus, newOrder) => {
    setTasks(prev => {
      const others = prev.filter(t => t.id != taskId);
      const task = prev.find(t => t.id == taskId);
      if (!task) return prev;
      const updated = { ...task, status: newStatus, order: newOrder };
      if (newStatus !== 'completed' && newStatus !== 'approved') {
        return [...others.filter(t => t.status !== newStatus || t.status === newStatus), updated]
          .sort((a, b) => a.order - b.order);
      }
      return [...others, updated];
    });
    await api.update(taskId, { status: newStatus });
  }, []);

  const value = { tasks, loading, COLUMNS, refresh, addTask, updateTask, deleteTask, moveTask };
  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be inside TaskProvider');
  return ctx;
};
