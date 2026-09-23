import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { Icon } from '../components/Icon.jsx';

const FEATURES = [
  { title: 'Queue from anywhere', body: "Pick a service, get your ticket, and arrive when you're next." },
  { title: 'Scan-in at the kiosk', body: 'Show your QR code at the machine to confirm arrival instantly.' },
  { title: 'Repeat scripts', body: 'Chronic medication reminders and collection-ready alerts.' },
  { title: 'Health passport', body: 'Allergies, chronic conditions and blood type shared with responders.' },
];

const EMS_STEPS = [
  'Patient holds SOS — GPS location and health passport are attached.',
  'Nearest available ambulance is matched and accepts the call.',
  'Hospital receives a pre-alert and prepares the right bay before arrival.',
  'Patient and family track the ambulance live until handover.',
];

export default function Mobile() {
  return (
    <Layout>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">Pioneer Health Mobile</h1>
          <p className="mt-4 text-lg text-ink-soft">
            The kiosk in your pocket — join a queue before you leave home, and one tap connects you
            straight to Emergency Medical Services.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <h3 className="font-semibold text-ink">{f.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Phone mock */}
        <div className="mx-auto w-full max-w-xs">
          <div className="rounded-[2.5rem] border-8 border-slate-900 bg-slate-900 p-3 shadow-card">
            <div className="rounded-[1.8rem] bg-canvas p-5">
              <p className="text-sm text-ink-soft">Good morning</p>
              <p className="text-xl font-bold text-ink">Thandi</p>

              <div className="mt-4 rounded-xl bg-brand-600 p-4 text-white">
                <p className="text-[11px] uppercase tracking-wide opacity-80">Your ticket</p>
                <p className="text-3xl font-extrabold">C-061</p>
                <p className="mt-1 text-xs opacity-90">
                  Medical Consultation · 4 people ahead · ~14 min
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-semibold text-ink-soft">
                {['Book', 'Scripts', 'Check in', 'Nurse line'].map((a) => (
                  <div key={a} className="rounded-lg bg-white py-3 shadow-sm">
                    {a}
                  </div>
                ))}
              </div>

              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white">
                <Icon name="alert" className="h-4 w-4" /> Hold for SOS
              </button>
              <p className="mt-2 text-center text-[11px] text-ink-faint">
                Connects to EMS and shares your location
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* EMS integration */}
      <div className="mt-14">
        <h2 className="text-2xl font-bold text-ink">EMS integration</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EMS_STEPS.map((step, i) => (
            <div key={i} className="card p-5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="mt-3 text-sm text-ink-soft">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex gap-3">
        <Link to="/dashboard" className="btn-ghost">
          Staff dashboard
        </Link>
        <Link to="/" className="btn-ghost">
          Kiosk
        </Link>
      </div>
    </Layout>
  );
}
