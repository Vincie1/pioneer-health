import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { Icon } from '../components/Icon.jsx';
import { SERVICE_MAP, STATUS_LABEL } from '../lib/constants.js';
import { api } from '../lib/api.js';

const STATUS_STYLE = {
  waiting: 'bg-amber-50 text-amber-700',
  called: 'bg-brand-50 text-brand-700',
  in_room: 'bg-blue-50 text-blue-700',
  done: 'bg-slate-100 text-slate-500',
};

function minsAgo(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return `${m} min`;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [nurse, setNurse] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, t, e, sc, nr] = await Promise.all([
        api.stats(),
        api.listTickets(),
        api.listEmergencies(),
        api.listScripts(),
        api.listNurseRequests(),
      ]);
      setStats(s);
      setTickets(t);
      setEmergencies(e);
      setScripts(sc);
      setNurse(nr);
      setError('');
    } catch (err) {
      // Surface failures instead of silently rendering an empty queue.
      setError(
        `Could not reach the API${
          import.meta.env.VITE_API_URL ? ` at ${import.meta.env.VITE_API_URL}` : ' (VITE_API_URL is not set)'
        }. ${err.message}`,
      );
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  // Advance a single ticket through its lifecycle.
  async function advanceTicket(code, status) {
    await api.setStatus(code, status).catch(() => {});
    load();
  }

  async function advanceEmergency(code, status) {
    await api.setEmergencyStatus(code, status).catch(() => {});
    load();
  }

  async function advanceScript(id, status) {
    await api.setScriptStatus(id, status).catch(() => {});
    load();
  }

  async function answerNurse(id) {
    await api.setNurseStatus(id, 'answered').catch(() => {});
    load();
  }

  // Next status in the ticket lifecycle, or null if terminal.
  const NEXT_STATUS = { waiting: 'called', called: 'in_room', in_room: 'done' };
  const NEXT_LABEL = { waiting: 'Call', called: 'In room', in_room: 'Done' };

  const waiting = tickets.filter((t) => t.status !== 'done');

  return (
    <Layout variant="dashboard">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Staff Dashboard</h1>
        <p className="mt-1 text-ink-soft">Everything checked in at the kiosk, in real time.</p>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile value={stats?.inQueue ?? '—'} label="In queue now" />
        <StatTile value={stats?.atHome ?? '—'} label="Booked from home" />
        <StatTile value={stats ? `${stats.avgWait} min` : '—'} label="Avg. wait" />
        <StatTile value={stats?.servedToday ?? '—'} label="Served today" />
        <StatTile
          value={stats?.activeEmergencies ?? '—'}
          label="Active emergencies"
          alert={(stats?.activeEmergencies ?? 0) > 0}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Waiting patients */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-ink">Waiting patients</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {waiting.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-faint">The queue is empty.</p>
            )}
            {waiting.map((t) => (
              <div key={t.id} className="flex items-center gap-4 py-3">
                <span className="w-16 shrink-0 font-mono text-sm font-semibold text-ink">
                  {t.code}
                </span>
                <span className="flex-1 truncate text-sm text-ink">{t.fullName}</span>
                <span className="hidden text-xs text-ink-faint sm:block">{minsAgo(t.createdAt)}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[t.status]}`}
                >
                  {STATUS_LABEL[t.status]}
                </span>
                {NEXT_STATUS[t.status] && (
                  <button
                    onClick={() => advanceTicket(t.code, NEXT_STATUS[t.status])}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      NEXT_STATUS[t.status] === 'done'
                        ? 'bg-brand-600 text-white hover:bg-brand-700'
                        : 'border border-slate-200 text-brand-700 hover:bg-brand-50'
                    }`}
                  >
                    {NEXT_LABEL[t.status]}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Queue by service */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-ink">Queue by service</h2>
            <div className="mt-4 space-y-3">
              {(stats?.perService ?? []).map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="text-sm text-ink-soft">{SERVICE_MAP[s.key]?.name ?? s.name}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                    <Icon name="clock" className="h-4 w-4" /> {s.estimatedWait} min
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency feed */}
          <div className="card overflow-hidden">
            <div className="bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white">
              Emergency feed
            </div>
            <div className="divide-y divide-red-50 p-2">
              {emergencies.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-ink-faint">No active emergencies.</p>
              )}
              {emergencies.map((e) => (
                <div key={e.id} className="px-4 py-4">
                  <p className="flex items-center gap-2 font-semibold text-red-700">
                    <Icon name="alert" className="h-4 w-4" />
                    {labelForType(e.type)} • Priority {e.priority}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {e.note ?? `${e.code} raised from kiosk`}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-600">
                      {e.status}
                    </span>
                    {e.status === 'active' && (
                      <button
                        onClick={() => advanceEmergency(e.code, 'dispatched')}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                      >
                        Dispatch EMS
                      </button>
                    )}
                    {e.status === 'dispatched' && (
                      <button
                        onClick={() => advanceEmergency(e.code, 'resolved')}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:bg-slate-50"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile activity — scripts + nurse-line requests from the app */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-ink">Mobile activity</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Repeat scripts ({scripts.length})
                </p>
                <div className="mt-2 space-y-1.5">
                  {scripts.length === 0 && <p className="text-sm text-ink-faint">None requested.</p>}
                  {scripts.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-ink">{s.medication}</span>
                      {s.status === 'requested' && (
                        <button
                          onClick={() => advanceScript(s.id, 'ready')}
                          className="shrink-0 rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-50"
                        >
                          Mark ready
                        </button>
                      )}
                      {s.status === 'ready' && (
                        <button
                          onClick={() => advanceScript(s.id, 'collected')}
                          className="shrink-0 rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-ink-soft hover:bg-slate-50"
                        >
                          Collected
                        </button>
                      )}
                      {s.status === 'collected' && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase text-ink-faint">
                          Collected
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Nurse callbacks ({nurse.length})
                </p>
                <div className="mt-2 space-y-1.5">
                  {nurse.length === 0 && <p className="text-sm text-ink-faint">No open requests.</p>}
                  {nurse.slice(0, 4).map((n) => (
                    <div key={n.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-ink">
                        {n.patientName}
                        {n.reason && <span className="text-ink-faint"> — {n.reason}</span>}
                      </span>
                      <button
                        onClick={() => answerNurse(n.id)}
                        className="shrink-0 rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-50"
                      >
                        Answered
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatTile({ value, label, alert }) {
  return (
    <div className={`card p-6 ${alert ? 'ring-2 ring-red-200' : ''}`}>
      <p className={`text-4xl font-extrabold tracking-tight ${alert ? 'text-red-600' : 'text-ink'}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function labelForType(type) {
  const map = {
    cardiac: 'Chest pain / cardiac',
    stroke: 'Suspected stroke',
    bleeding: 'Severe bleeding',
    trauma: 'Trauma / accident',
    breathing: 'Difficulty breathing',
    other: 'Other emergency',
  };
  return map[type] ?? type;
}
