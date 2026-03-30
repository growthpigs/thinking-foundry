const API_BASE = import.meta.env.VITE_API_URL || '';

export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/s/${token}`, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

export function getWsUrl(): string {
  const base = import.meta.env.VITE_WS_URL;
  if (base) return base;
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}
