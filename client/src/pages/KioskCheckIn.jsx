import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { Icon } from '../components/Icon.jsx';
import { SERVICE_MAP } from '../lib/constants.js';
import { api } from '../lib/api.js';

// Kiosk "Check in" screen. A patient who booked on mobile presents their QR
// (which encodes the ticket code); staff/patient enters that code here to
// confirm arrival, flipping the ticket from at_home -> arrived so it joins the
// physical queue on the staff dashboard.
export default function KioskCheckIn() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const t = await api.arrive(c);
      setResult(t);
      setCode('');
    } catch (err) {
      setError(err.message === 'Ticket not found' ? `No ticket found for "${c}".` : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
        <Icon name="arrow-left" className="h-4 w-4" /> Back to services
      </Link>

      <div className="mx-auto mt-8 max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">Scan / Check in</h1>
        <p className="mt-2 text-ink-soft">
          Scan the QR code from the Pioneer Health app, or enter your ticket code below to confirm
          you&apos;ve arrived.
        </p>

        <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
          <input
            className="field text-center text-2xl font-bold tracking-widest"
            placeholder="C-063"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Checking in…' : 'Confirm arrival'}
          </button>
        </form>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {result && (
          <div className="mt-6 rounded-xl2 border border-brand-100 bg-brand-50 p-6">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white">
              <Icon name="check" className="h-6 w-6" />
            </span>
            <p className="mt-3 text-2xl font-extrabold text-brand-700">{result.code}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {result.alreadyArrived ? 'Already checked in' : 'Checked in'} ·{' '}
              {SERVICE_MAP[result.service]?.name}
            </p>
            {result.peopleAhead != null && (
              <p className="mt-2 text-sm text-ink">
                {result.peopleAhead} ahead · ~{result.estimatedWait} min
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
