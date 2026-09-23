// API base is configurable so the frontend can point at a deployed backend
// (Render/Railway/Fly) when hosted on Netlify. In dev, Vite proxies /api.
const BASE = import.meta.env.VITE_API_URL || '';

async function req(path, options) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  services: () => req('/services'),
  emergencyTypes: () => req('/emergency-types'),
  patient: () => req('/patient'),

  createTicket: (data) => req('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  getTicket: (code) => req(`/tickets/${code}`),
  listTickets: () => req('/tickets'),
  callNext: (service) => req(`/tickets/call-next/${service}`, { method: 'POST' }),
  setStatus: (code, status) =>
    req(`/tickets/${code}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  arrive: (code) => req(`/tickets/${code}/arrive`, { method: 'POST' }),

  createEmergency: (data) =>
    req('/emergencies', { method: 'POST', body: JSON.stringify(data) }),
  listEmergencies: () => req('/emergencies'),
  setEmergencyStatus: (code, status) =>
    req(`/emergencies/${code}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  createScript: (data) => req('/scripts', { method: 'POST', body: JSON.stringify(data) }),
  listScripts: (patient) => req(`/scripts${patient ? `?patient=${encodeURIComponent(patient)}` : ''}`),
  setScriptStatus: (id, status) =>
    req(`/scripts/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  createNurseRequest: (data) =>
    req('/nurse-requests', { method: 'POST', body: JSON.stringify(data) }),
  listNurseRequests: () => req('/nurse-requests'),
  setNurseStatus: (id, status) =>
    req(`/nurse-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  stats: () => req('/stats'),
};
