import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { Icon } from '../components/Icon.jsx';
import { SERVICE_MAP, STATUS_LABEL } from '../lib/constants.js';
import { api } from '../lib/api.js';

export default function TicketConfirmation() {
  const { code } = useParams();
  const location = useLocation();
  const [ticket, setTicket] = useState(location.state?.ticket ?? null);
  const [error, setError] = useState('');

  // Poll the ticket so the confirmation reflects the live queue position.
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const t = await api.getTicket(code);
        if (alive) setTicket(t);
      } catch (err) {
        if (alive) setError(err.message);
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [code]);

  const meta = ticket ? SERVICE_MAP[ticket.service] : null;

  return (
    <Layout>
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
        <Icon name="arrow-left" className="h-4 w-4" /> Back to services
      </Link>

      <div className="mx-auto mt-8 max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-600">
          <Icon name="check" className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-ink">You&apos;re checked in</h1>
        <p className="mt-1 text-ink-soft">Please keep this ticket handy.</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {ticket && (
          <div className="card mt-8 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Your ticket
            </p>
            <p className="mt-2 text-6xl font-extrabold tracking-tight text-brand-600">
              {ticket.code}
            </p>
            <p className="mt-4 text-ink-soft">{meta?.name}</p>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <Stat label="Ahead of you" value={ticket.peopleAhead ?? '—'} />
              <Stat label="Est. wait" value={`${ticket.estimatedWait ?? meta?.wait} min`} />
              <Stat label="Status" value={STATUS_LABEL[ticket.status] ?? ticket.status} />
            </div>

            <p className="mt-6 text-xs text-ink-faint">
              This page updates automatically. You&apos;ll be called by ticket number.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3">
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
