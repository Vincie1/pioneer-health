import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout.jsx';
import { Icon } from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import {
  EMERGENCY_LABEL,
  DISPATCH_MAP,
  DISPATCH_STAGES,
  DISPATCH_STYLE,
} from '../lib/constants.js';

// Paramedic-facing dispatch console. A crew opens this page, sees the live
// emergency calls, accepts one, and taps through their run status
// (en route → on scene → transporting → arrived). Every tap writes real
// dispatch state that the staff dashboard and the patient's mobile SOS screen
// read back, so what the patient sees is what the paramedic actually entered.
export default function Ambulance() {
  const [emergencies, setEmergencies] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const list = await api.listEmergencies();
      setEmergencies(list);
      setError('');
    } catch (err) {
      setError(`Could not reach dispatch. ${err.message}`);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  const active = emergencies.filter((e) => e.dispatchStatus !== 'arrived');

  return (
    <Layout variant="dashboard">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-600 text-white">
          <Icon name="ambulance" className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Ambulance dispatch</h1>
          <p className="text-sm text-ink-soft">
            Paramedic console — accept a call and update your status en route.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-ink-soft">
          No active emergency calls right now.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {active.map((e) => (
            <RunCard key={e.code} run={e} onChange={load} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function RunCard({ run, onChange }) {
  const stage = DISPATCH_MAP[run.dispatchStatus] ?? DISPATCH_MAP.unassigned;
  const unassigned = run.dispatchStatus === 'unassigned';
  const [busy, setBusy] = useState(false);

  // Accept form fields (only shown when unassigned).
  const [paramedic, setParamedic] = useState('');
  const [unit, setUnit] = useState('EMS-A3');
  const [eta, setEta] = useState('11');
  const [bay, setBay] = useState('2');

  async function accept(ev) {
    ev.preventDefault();
    if (!paramedic.trim()) return;
    setBusy(true);
    try {
      await api.updateDispatch(run.code, {
        dispatchStatus: 'en_route',
        paramedic: paramedic.trim(),
        unit: unit.trim() || null,
        etaMinutes: eta,
        destinationBay: bay,
      });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function advance() {
    if (!stage.next) return;
    setBusy(true);
    try {
      await api.updateDispatch(run.code, { dispatchStatus: stage.next });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-bold text-ink">{run.code}</p>
          <p className="text-sm font-medium text-ink-soft">
            {EMERGENCY_LABEL[run.type] ?? run.type} · Priority {run.priority}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            DISPATCH_STYLE[run.dispatchStatus] ?? DISPATCH_STYLE.unassigned
          }`}
        >
          {stage.label}
        </span>
      </div>

      {run.note && <p className="mt-3 text-xs text-ink-faint">{run.note}</p>}

      {!unassigned && (
        <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-ink-soft">
          <p className="flex items-center gap-2">
            <Icon name="ambulance" className="h-4 w-4 text-red-600" />
            {run.paramedic ? `Paramedic ${run.paramedic}` : 'Crew'}
            {run.unit ? ` · ${run.unit}` : ''}
          </p>
          {run.etaMinutes != null && (
            <p className="flex items-center gap-2">
              <Icon name="clock" className="h-4 w-4 text-brand-600" /> ETA {run.etaMinutes} min
            </p>
          )}
          {run.destinationBay != null && (
            <p className="flex items-center gap-2">
              <Icon name="bell" className="h-4 w-4 text-brand-600" /> Trauma bay {run.destinationBay}
            </p>
          )}
        </div>
      )}

      {unassigned ? (
        <form onSubmit={accept} className="mt-4 space-y-2">
          <input
            value={paramedic}
            onChange={(ev) => setParamedic(ev.target.value)}
            placeholder="Your name (e.g. Naidoo)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              value={unit}
              onChange={(ev) => setUnit(ev.target.value)}
              placeholder="Unit"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <input
              value={eta}
              onChange={(ev) => setEta(ev.target.value)}
              inputMode="numeric"
              placeholder="ETA min"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <input
              value={bay}
              onChange={(ev) => setBay(ev.target.value)}
              inputMode="numeric"
              placeholder="Bay"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !paramedic.trim()}
            className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Accept &amp; respond
          </button>
        </form>
      ) : (
        stage.next && (
          <button
            onClick={advance}
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {stage.action}
          </button>
        )
      )}
    </div>
  );
}
