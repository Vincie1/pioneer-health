import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { Icon } from '../components/Icon.jsx';
import { SERVICES } from '../lib/constants.js';

export default function KioskHome() {
  return (
    <Layout>
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Welcome
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Self-Service Kiosk
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink-soft">
          Please select the service you need to get started.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <Link
            key={s.key}
            to={`/service/${s.key}`}
            className="card group flex items-center gap-4 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
              <Icon name={s.icon} className="h-7 w-7" />
            </span>
            <span className="flex-1">
              <span className="block text-lg font-semibold text-ink">{s.name}</span>
              <span className="block text-sm text-ink-soft">{s.subtitle}</span>
            </span>
            <Icon
              name="chevron-right"
              className="h-5 w-5 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand-600"
            />
          </Link>
        ))}
      </div>

      {/* Already booked on the mobile app → scan-in / check-in */}
      <Link
        to="/checkin"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-6 py-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
      >
        <Icon name="check" className="h-5 w-5" />
        Already booked on the app? Scan / Check in
      </Link>

      {/* Emergency */}
      <div className="mt-8 overflow-hidden rounded-xl2 border border-red-100 bg-red-50">
        <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
              <Icon name="alert" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-red-700">Emergency?</h2>
              <p className="text-sm text-red-600/90">
                If this is a life-threatening situation, get help now.
              </p>
            </div>
          </div>
          <Link
            to="/emergency"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.99]"
          >
            <Icon name="alert" className="h-5 w-5" />
            Get Emergency Assistance
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 text-sm">
        <button className="flex items-center gap-2 text-ink-soft hover:text-ink">
          <Icon name="help" className="h-4 w-4" /> Need Help?
        </button>
        <button className="flex items-center gap-2 text-ink-soft hover:text-ink">
          <Icon name="globe" className="h-4 w-4" /> Change Language
        </button>
      </div>
    </Layout>
  );
}
