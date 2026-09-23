import { useState, useEffect, useCallback } from 'react';

// Persists the mobile patient's active ticket code in localStorage so the app
// "remembers" their booking across reloads (no real auth in this demo).
const KEY = 'ph_active_ticket';

export function useActiveTicket() {
  const [code, setCode] = useState(() => localStorage.getItem(KEY) || null);

  useEffect(() => {
    if (code) localStorage.setItem(KEY, code);
    else localStorage.removeItem(KEY);
  }, [code]);

  const clear = useCallback(() => setCode(null), []);
  return [code, setCode, clear];
}
