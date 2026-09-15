const API = process.env.NEXT_PUBLIC_API_URL || '';

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/api/auth/me'),
  getStudents: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/students${q}`);
  },
  createStudent: (data: Record<string, unknown>) =>
    apiFetch('/api/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/api/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleStudentStatus: (id: string) =>
    apiFetch(`/api/students/${id}/status`, { method: 'PATCH' }),
  getStudentQr: (id: string) => apiFetch(`/api/students/${id}/qr`),
  scanAttendance: (qrToken: string) =>
    apiFetch('/api/attendance/scan', { method: 'POST', body: JSON.stringify({ qrToken }) }),
  manualAttendance: (studentId: string, type: 'ENTRY' | 'EXIT') =>
    apiFetch('/api/attendance/manual', { method: 'POST', body: JSON.stringify({ studentId, type }) }),
  getAttendance: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/attendance${q}`);
  },
  getTodayAttendance: () => apiFetch('/api/attendance/today'),
  getOccupancy: () => apiFetch('/api/attendance/occupancy'),
  getFees: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/fees${q}`);
  },
  getOverdueFees: () => apiFetch('/api/fees/overdue'),
  payFee: (id: string, amount: number, method?: string) =>
    apiFetch(`/api/fees/${id}/pay`, { method: 'POST', body: JSON.stringify({ amount, method }) }),
  generateFees: (month: string) =>
    apiFetch('/api/fees/generate', { method: 'POST', body: JSON.stringify({ month }) }),
  getStudentFees: (studentId: string) => apiFetch(`/api/fees/student/${studentId}`),
  getDashboard: () => apiFetch('/api/dashboard/summary'),
  getSettings: () => apiFetch('/api/settings'),
  updateSettings: (data: Record<string, unknown>) =>
    apiFetch('/api/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  getStaff: () => apiFetch('/api/settings/staff'),
  createStaff: (data: Record<string, unknown>) =>
    apiFetch('/api/settings/staff', { method: 'POST', body: JSON.stringify(data) }),
  deleteStaff: (id: string) => apiFetch(`/api/settings/staff/${id}`, { method: 'DELETE' }),
};
