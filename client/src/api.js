const BASE = '/api';

async function request(method, url, body) {
  const token = localStorage.getItem('accounting_token');
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur' }));
    if (res.status === 401) { localStorage.removeItem('accounting_token'); window.location.href = '/login'; }
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
}

export const get = (url) => request('GET', url);
export const post = (url, body) => request('POST', url, body);
export const put = (url, body) => request('PUT', url, body);
export const del = (url) => request('DELETE', url);
