/** Thin fetch wrapper around the REST API. Every page talks to the
 *  backend through these functions only — never raw fetch. */
const BASE = '/api';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};

// ── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgot: (email) => api.post('/auth/forgot-password', { email }),
  reset: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// ── Public ───────────────────────────────────────────────────────────
export const publicApi = {
  settings: () => api.get('/settings'),
  machines: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return api.get(`/machines${qs ? `?${qs}` : ''}`);
  },
  machine: (slug) => api.get(`/machines/${slug}`),
  exercises: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return api.get(`/exercises${qs ? `?${qs}` : ''}`);
  },
  plans: () => api.get('/plans'),
  memberships: () => api.get('/memberships'),
  nutrition: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return api.get(`/nutrition${qs ? `?${qs}` : ''}`);
  },
  article: (slug) => api.get(`/nutrition/${slug}`),
  testimonials: () => api.get('/testimonials'),
  contact: (data) => api.post('/contact', data),
  search: (q) => api.get(`/search?q=${encodeURIComponent(q)}`),
};

// ── Member ───────────────────────────────────────────────────────────
export const memberApi = {
  profile: () => api.get('/member/me'),
  updateProfile: (data) => api.put('/member/profile', data),
  workout: () => api.get('/member/workout'),
  regenerate: () => api.post('/member/workout/regenerate'),
  complete: (data) => api.post('/member/workout/complete', data),
  history: () => api.get('/member/history'),
  stats: () => api.get('/member/stats'),
  createGoal: (data) => api.post('/member/goals', data),
  updateGoal: (id, data) => api.put(`/member/goals/${id}`, data),
  deleteGoal: (id) => api.del(`/member/goals/${id}`),
  favorites: () => api.get('/member/favorites'),
  addFavorite: (id) => api.post(`/member/favorites/${id}`),
  removeFavorite: (id) => api.del(`/member/favorites/${id}`),
  attendance: () => api.get('/member/attendance'),
  checkinCode: () => api.get('/member/checkin-code'),
  checkin: (code) => api.post('/member/attendance/checkin', { code }),
  subscription: () => api.get('/member/subscription'),
  subscribe: (planId) => api.post('/member/subscribe', { planId }),
  notifications: () => api.get('/member/notifications'),
  markRead: (data) => api.put('/member/notifications/read', data),
  trainerRequest: (message) => api.post('/member/trainer-request', { message }),
  recommendations: () => api.get('/member/recommendations'),
};

// ── Admin ────────────────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  members: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return api.get(`/admin/members${qs ? `?${qs}` : ''}`);
  },
  member: (id) => api.get(`/admin/members/${id}`),
  createMember: (data) => api.post('/admin/members', data),
  updateMember: (id, data) => api.put(`/admin/members/${id}`, data),
  deleteMember: (id) => api.del(`/admin/members/${id}`),
  deactivateMember: (id) => api.post(`/admin/members/${id}/deactivate`),
  assignPlan: (id, planId) => api.post(`/admin/members/${id}/assign-plan`, { planId }),
  createMachine: (data) => api.post('/admin/machines', data),
  updateMachine: (id, data) => api.put(`/admin/machines/${id}`, data),
  deleteMachine: (id) => api.del(`/admin/machines/${id}`),
  exercises: () => api.get('/admin/exercises'),
  createExercise: (data) => api.post('/admin/exercises', data),
  updateExercise: (id, data) => api.put(`/admin/exercises/${id}`, data),
  deleteExercise: (id) => api.del(`/admin/exercises/${id}`),
  plans: () => api.get('/admin/plans'),
  createPlan: (data) => api.post('/admin/plans', data),
  updatePlan: (id, data) => api.put(`/admin/plans/${id}`, data),
  deletePlan: (id) => api.del(`/admin/plans/${id}`),
  schedule: () => api.get('/admin/schedule'),
  updateSchedule: (schedule) => api.put('/admin/schedule', { schedule }),
  memberships: () => api.get('/admin/memberships'),
  createMembership: (data) => api.post('/admin/memberships', data),
  updateMembership: (id, data) => api.put(`/admin/memberships/${id}`, data),
  deleteMembership: (id) => api.del(`/admin/memberships/${id}`),
  subscriptions: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return api.get(`/admin/subscriptions${qs ? `?${qs}` : ''}`);
  },
  updateSubscription: (id, status) => api.put(`/admin/subscriptions/${id}`, { status }),
  attendance: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return api.get(`/admin/attendance${qs ? `?${qs}` : ''}`);
  },
  markAttendance: (userId, date) => api.post('/admin/attendance', { userId, date }),
  verifyCheckIn: (code) => api.post('/admin/attendance/verify', { code }),
  articles: () => api.get('/admin/nutrition'),
  createArticle: (data) => api.post('/admin/nutrition', data),
  updateArticle: (id, data) => api.put(`/admin/nutrition/${id}`, data),
  deleteArticle: (id) => api.del(`/admin/nutrition/${id}`),
  testimonials: () => api.get('/admin/testimonials'),
  createTestimonial: (data) => api.post('/admin/testimonials', data),
  updateTestimonial: (id, data) => api.put(`/admin/testimonials/${id}`, data),
  deleteTestimonial: (id) => api.del(`/admin/testimonials/${id}`),
  messages: () => api.get('/admin/messages'),
  markMessageRead: (id) => api.put(`/admin/messages/${id}`),
  deleteMessage: (id) => api.del(`/admin/messages/${id}`),
  announce: (data) => api.post('/admin/notifications', data),
  settings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
};

// ── Formatters ───────────────────────────────────────────────────────
export const fmt = {
  date: (iso, opts) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-IN', opts || { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  },
  time: (iso) => { try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); } catch { return iso; } },
  money: (n, currency = '₹') => `${currency}${Number(n).toLocaleString('en-IN')}`,
  goalLabel: (g) => ({
    general_fitness: 'General Fitness', strength: 'Strength', muscle_development: 'Muscle Development',
    endurance: 'Endurance', mobility: 'Mobility', weight_management: 'Weight Management', sports_conditioning: 'Sports Conditioning',
  }[g] || g),
  levelLabel: (l) => ({ beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }[l] || l),
};
