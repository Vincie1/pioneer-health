import { useState } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { Icon } from '../components/Icon.jsx';
import { SERVICE_MAP } from '../lib/constants.js';
import { api } from '../lib/api.js';

export default function ServiceCheckIn() {
  const { service } = useParams();
  const navigate = useNavigate();
  const meta = SERVICE_MAP[service];

  const [form, setForm] = useState({ fullName: '', idNumber: '', mobile: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!meta) return <Navigate to="/" replace />;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const ticket = await api.createTicket({ service, ...form });
      navigate(`/ticket/${ticket.code}`, { state: { ticket } });
    } catch (err) {
      setError(err.message || 'Could not create your ticket. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
        <Icon name="arrow-left" className="h-4 w-4" /> Back to services
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name={meta.icon} className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">{meta.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-ink-soft">
            {meta.subtitle}
            <span className="text-ink-faint">·</span>
            <span className="inline-flex items-center gap-1 text-brand-700">
              <Icon name="clock" className="h-4 w-4" /> Estimated wait {meta.wait} minutes
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card mt-8 space-y-5 p-6 sm:p-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">Full name</label>
          <input
            className="field"
            placeholder="e.g. Thandi Mokoena"
            value={form.fullName}
            onChange={update('fullName')}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">
            ID / Passport number
          </label>
          <input
            className="field"
            placeholder="e.g. 9001015800083"
            value={form.idNumber}
            onChange={update('idNumber')}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">Mobile number</label>
          <input
            className="field"
            placeholder="e.g. 082 123 4567"
            value={form.mobile}
            onChange={update('mobile')}
            required
          />
        </div>

        <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-ink-soft">
          Your information is used only to route you to the right service and is protected under
          POPIA.
        </p>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Getting your ticket…' : 'Get my queue ticket'}
        </button>
      </form>
    </Layout>
  );
}
