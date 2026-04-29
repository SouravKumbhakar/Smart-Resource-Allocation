const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Central fetch wrapper.
 * @param skipAuthRedirect - set true to suppress the 401 → logout redirect
 *   (used for non-auth data queries so a transient 401 doesn't wipe the session)
 */
const fetchApi = async (endpoint: string, options: RequestInit = {}, skipAuthRedirect = false) => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await response.json();

  // Only force-logout on 401 if we're on an auth-critical endpoint
  // Transient 401s on data queries (notifications, dashboard) must NOT wipe the session
  if (response.status === 401 && !skipAuthRedirect) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
};

// ── Auth ───────────────────────────────────────────────────────────────────
// getMe uses skipAuthRedirect=false — a real 401 here means the session is gone
export const login  = (credentials: any) => fetchApi('/auth/login',    { method: 'POST', body: JSON.stringify(credentials) });
export const register = (userData: any) => fetchApi('/auth/register',  { method: 'POST', body: JSON.stringify(userData) });
export const getMe  = ()                => fetchApi('/auth/me').then(res => res.user);

// ── Needs ──────────────────────────────────────────────────────────────────
// Data queries use skipAuthRedirect=true — transient errors should NOT log out
export const getNeeds    = (params?: { search?: string; category?: string; status?: string; sort?: string }) => {
  const q = new URLSearchParams();
  if (params?.search)   q.set('search',   params.search);
  if (params?.category) q.set('category', params.category);
  if (params?.status)   q.set('status',   params.status);
  if (params?.sort)     q.set('sort',     params.sort);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return fetchApi(`/needs${qs}`, {}, true).then(res => res.data);
};
export const getNeedById = (id: string)     => fetchApi(`/needs/${id}`, {}, true).then(res => res.data);
export const createNeed  = (data: any)      => fetchApi('/needs', { method: 'POST',  body: JSON.stringify(data) }).then(res => res.data);
export const updateNeed  = (id: string, data: any) => fetchApi(`/needs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(res => res.data);
export const deleteNeed  = (id: string)     => fetchApi(`/needs/${id}`, { method: 'DELETE' });

// ── Volunteers ─────────────────────────────────────────────────────────────
export const getVolunteers         = ()                  => fetchApi('/volunteers', {}, true).then(res => res.data);
export const getNearbyVolunteers   = (lat: number, lng: number) => fetchApi(`/volunteers/nearby?lat=${lat}&lng=${lng}`, {}, true).then(res => res.data);
export const getVolunteerById      = (id: string)        => fetchApi(`/volunteers/${id}`, {}, true).then(res => res.data);
export const updateVolunteer       = (id: string, data: any) => fetchApi(`/volunteers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(res => res.data);

// ── Match & Assignments ────────────────────────────────────────────────────
export const getMatches       = (needId: string) => fetchApi(`/match/${needId}`, { method: 'POST' }, true).then(res => res.matches);
export const getAssignments   = ()               => fetchApi('/assignments', {}, true).then(res => res.data);
export const createAssignment = (data: any)      => fetchApi('/assignments/assign', { method: 'POST', body: JSON.stringify(data) }).then(res => res.data);
export const completeAssignment = (id: string)   => fetchApi(`/assignments/assign/${id}/complete`, { method: 'PATCH' }).then(res => res.data);

// ── Notifications ──────────────────────────────────────────────────────────
export const getNotifications = () => fetchApi('/notifications', {}, true).then(res => res.data);
export const markNotificationAsRead = (id: string) => fetchApi(`/notifications/${id}/read`, { method: 'PATCH' }, true).then(res => res.data);
export const markAllNotificationsAsRead = () => fetchApi('/notifications/read-all', { method: 'PATCH' }, true).then(res => res.message);

// ── Users (General) ────────────────────────────────────────────────────────
export const getUsers = () => fetchApi('/users', {}, true).then(res => res.data);
export const updateAvailability = (availability: boolean) => 
  fetchApi('/users/availability', { method: 'PATCH', body: JSON.stringify({ availability }) }).then(res => res.data);
export const updateProfile = (data: any) => 
  fetchApi('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }).then(res => res.data);

export const getStats = () => fetchApi('/stats', {}, true).then(res => res.data);

// ── Super Admin API ────────────────────────────────────────────────────────
export const getAdminStats      = ()                          => fetchApi('/admin/stats', {}, true).then(res => res.data);
export const getAdminUsers      = ()                          => fetchApi('/admin/users', {}, true).then(res => res.data);
export const updateUserRole     = (id: string, role: string) => fetchApi(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }).then(res => res.data);
export const updateUserStatus   = (id: string, status: string) => fetchApi(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }).then(res => res.data);
export const deleteAdminUser    = (id: string)               => fetchApi(`/admin/users/${id}`, { method: 'DELETE' });
export const getAuditLogs       = (page = 1)                 => fetchApi(`/admin/audit-logs?page=${page}&limit=20`, {}, true).then(res => res);
export const getNgoPerformance  = ()                         => fetchApi('/admin/ngo-performance', {}, true).then(res => res.data);

// ── Assignment Detail & Workflow ───────────────────────────────────────────
export const getAssignmentById  = (id: string)               => fetchApi(`/assignments/${id}`, {}, true).then(res => res.data);
export const submitAssignment   = (id: string, data: { text: string; images: string[] }) =>
  fetchApi(`/assignments/${id}/submit`, { method: 'PATCH', body: JSON.stringify(data) }).then(res => res.data);
export const approveAssignment  = (id: string)               => fetchApi(`/assignments/${id}/approve`, { method: 'PATCH' }).then(res => res.data);
export const rejectAssignment   = (id: string, feedback: string) =>
  fetchApi(`/assignments/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ feedback }) }).then(res => res.data);

// ── File Upload ────────────────────────────────────────────────────────────
export const uploadFile = async (file: File): Promise<string> => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', file);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url as string;
};

// ── Volunteer Profile Update ──────────────────────────────────────────────
export const updateMyProfile = (id: string, data: any) =>
  fetchApi(`/volunteers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(res => res.data);

