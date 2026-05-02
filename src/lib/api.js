const BASE = '/api';

async function fetcher(url, options = {}) {
  const res = await fetch(`${BASE}/${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let errMsg = `API error ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.error) errMsg = errData.error;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

export function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export const api = {
  list: () => fetcher('tasks'),

  create: (data) =>
    fetcher('tasks', {
      method: 'POST',
      body: JSON.stringify({ data }),
    }),

  update: (id, data) =>
    fetcher(`tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    }),

  delete: (id) =>
    fetcher(`tasks/${id}`, { method: 'DELETE' }),

  updateStatus: (id, status) => api.update(id, { status }),

  updateOrder: (tasks) =>
    Promise.all(
      tasks.map((t, i) =>
        t.status !== 'completed'
          ? api.update(t.id, { order: i })
          : Promise.resolve()
      )
    ),
};
