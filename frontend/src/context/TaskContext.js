'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const COLUMNS = [
    { id: 'not_started',    label: 'Not Started',    color: 'bg-neutral-100' },
    { id: 'ready_to_start', label: 'Ready to Start', color: 'bg-blue-50'    },
    { id: 'in_progress',    label: 'In Progress',    color: 'bg-yellow-50'  },
    { id: 'in_review',      label: 'In Review',      color: 'bg-purple-50'  },
    { id: 'completed',      label: 'Completed',      color: 'bg-green-50'   },
  ];

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list();
      setTasks(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTask = useCallback(async (taskData) => {
    const result = await api.create({ ...taskData, status: 'not_started', order: 0 });
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
      if (newStatus !== 'completed') {
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
