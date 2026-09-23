import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { Icon } from '../components/Icon.jsx';
import { EMERGENCY_TYPES } from '../lib/constants.js';
import { api } from '../lib/api.js';

export default function Emergency() {
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [dispatched, setDispatched] = useState(null);
  const [error, setError] = useState('');

  async function onSend() {
    if (!selected) return;
    setError('');
    setSubmitting(true);
    try {
      const em = await api.createEmergency({ type: selected });
      setDispatched(em);
    } catch (err) {
      setError(err.message || 'Could not send request. Please alert staff directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (dispatched) {
    return (
      <Layout>
        <div className="mx-auto mt-8 max-w-md text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-600">
            <Icon name="alert" className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-ink">Help is on the way</h1>
          <p className="mt-2 text-ink-soft">
            Your emergency request <span className="font-semibold text-red-600">{dispatched.code}</span>{' '}
            has been dispatched. Staff have been alerted. Please stay where you are.
          </p>
          <Link to="/" className="btn-ghost mt-8">
            Back to kiosk
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
        <Icon name="arrow-left" className="h-4 w-4" /> Back
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
          <Icon name="alert" className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-red-700">
            Emergency Assistance
          </h1>
          <p className="mt-1 text-ink-soft">
            Tell us what is happening so the right response is dispatched.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {EMERGENCY_TYPES.map((t) => {
          const active = selected === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setSelected(t.key)}
              className={`flex items-center gap-3 rounded-xl border-2 px-5 py-5 text-left text-base font-semibold transition ${
                active
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-ink hover:border-red-200'
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full border-2 ${
                  active ? 'border-red-500 bg-red-500 text-white' : 'border-slate-300'
                }`}
              >
                {active && <Icon name="check" className="h-3.5 w-3.5" />}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        onClick={onSend}
        disabled={!selected || submitting}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.99] disabled:opacity-50"
      >
        <Icon name="alert" className="h-5 w-5" />
        {submitting ? 'Sending…' : 'Send emergency request'}
      </button>
    </Layout>
  );
}
