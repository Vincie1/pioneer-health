import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { Icon } from '../components/Icon.jsx';
import { QRCode2 } from '../components/QRCode2.jsx';
import { SERVICES, SERVICE_MAP, STATUS_LABEL, EMERGENCY_TYPES } from '../lib/constants.js';
import { useActiveTicket } from '../lib/useActiveTicket.js';
import { api } from '../lib/api.js';

// Mocked logged-in patient (details come from the API /patient endpoint).
export default function Mobile() {
  const [patient, setPatient] = useState(null);
  const [code, setCode, clearCode] = useActiveTicket();
  const [ticket, setTicket] = useState(null);
  const [view, setView] = useState('home'); // home | book | checkin | scripts | nurse | sos
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.patient().then(setPatient).catch(() => {});
  }, []);

  // Poll the active ticket so at_home -> arrived and queue position update live.
  const loadTicket = useCallback(async () => {
    if (!code) {
      setTicket(null);
      return;
    }
    try {
      setTicket(await api.getTicket(code));
    } catch {
      // Ticket vanished (e.g. DB reset on redeploy) — forget it.
      clearCode();
      setTicket(null);
    }
  }, [code, clearCode]);

  useEffect(() => {
    loadTicket();
    const id = setInterval(loadTicket, 4000);
    return () => clearInterval(id);
  }, [loadTicket]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  return (
    <Layout>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        {/* Left: explainer */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">Pioneer Health Mobile</h1>
          <p className="mt-4 text-lg text-ink-soft">
            The kiosk in your pocket — join a queue before you leave home, scan in when you arrive,
            and one tap connects you to Emergency Medical Services.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Feature title="Queue from anywhere" body="Book a service and get your ticket before you leave home." />
            <Feature title="Scan-in at the kiosk" body="Show your QR at the machine to confirm arrival." />
            <Feature title="Repeat scripts" body="Request chronic medication and get collection alerts." />
            <Feature title="Health passport" body="Allergies, chronic conditions and blood type for responders." />
          </div>

          {patient && (
            <div className="card mt-6 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Health passport
              </p>
              <p className="mt-2 font-semibold text-ink">{patient.fullName}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Tag>Blood type: {patient.bloodType}</Tag>
                {patient.allergies.map((a) => (
                  <Tag key={a} tone="red">Allergy: {a}</Tag>
                ))}
                {patient.chronic.map((c) => (
                  <Tag key={c} tone="amber">{c}</Tag>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: the actual phone app */}
        <div className="mx-auto w-full max-w-sm">
          <div className="rounded-[2.5rem] border-8 border-slate-900 bg-slate-900 p-3 shadow-card">
            <div className="min-h-[560px] rounded-[1.8rem] bg-canvas p-5">
              <Phone
                patient={patient}
                ticket={ticket}
                view={view}
                setView={setView}
                setCode={setCode}
                clearCode={clearCode}
                reloadTicket={loadTicket}
                flash={flash}
              />
            </div>
          </div>
          {toast && (
            <p className="mt-3 rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white">
              {toast}
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 flex gap-3">
        <Link to="/dashboard" className="btn-ghost">Staff dashboard</Link>
        <Link to="/" className="btn-ghost">Kiosk</Link>
      </div>
    </Layout>
  );
}

// ---- phone screens ---------------------------------------------------------

function Phone({ patient, ticket, view, setView, setCode, clearCode, reloadTicket, flash }) {
  if (!patient) return <p className="text-sm text-ink-faint">Loading…</p>;

  if (view === 'book') {
    return <BookView patient={patient} setCode={setCode} setView={setView} flash={flash} />;
  }
  if (view === 'checkin') {
    return <CheckinView ticket={ticket} setView={setView} />;
  }
  if (view === 'scripts') {
    return <ScriptsView patient={patient} setView={setView} flash={flash} />;
  }
  if (view === 'nurse') {
    return <NurseView patient={patient} setView={setView} flash={flash} />;
  }
  if (view === 'sos') {
    return <SosView patient={patient} setView={setView} flash={flash} />;
  }

  // home
  return (
    <div>
      <p className="text-sm text-ink-soft">Good morning</p>
      <p className="text-xl font-bold text-ink">{patient.firstName}</p>

      {ticket ? <TicketCard ticket={ticket} /> : <NoTicketCard onBook={() => setView('book')} />}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Action label="Book" icon="stethoscope" onClick={() => setView('book')} />
        <Action label="Scripts" icon="pill" onClick={() => setView('scripts')} />
        <Action label="Check in" icon="check" onClick={() => setView('checkin')} disabled={!ticket} />
        <Action label="Nurse line" icon="heart" onClick={() => setView('nurse')} />
      </div>

      <button
        onClick={() => setView('sos')}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white"
      >
        <Icon name="alert" className="h-4 w-4" /> Hold for SOS
      </button>
      <p className="mt-2 text-center text-[11px] text-ink-faint">
        Connects to EMS and shares your location
      </p>

      {ticket && (
        <button
          onClick={() => {
            clearCode();
            flash('Booking cleared');
          }}
          className="mt-3 w-full text-center text-[11px] text-ink-faint hover:text-ink-soft"
        >
          Clear my booking
        </button>
      )}
    </div>
  );
}

function TicketCard({ ticket }) {
  const meta = SERVICE_MAP[ticket.service];
  const atHome = ticket.arrivalStatus === 'at_home';
  return (
    <div className={`mt-4 rounded-xl p-4 text-white ${atHome ? 'bg-slate-700' : 'bg-brand-600'}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide opacity-80">Your ticket</p>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {atHome ? 'At home' : STATUS_LABEL[ticket.status] ?? ticket.status}
        </span>
      </div>
      <p className="text-3xl font-extrabold">{ticket.code}</p>
      <p className="mt-1 text-xs opacity-90">
        {meta?.name}
        {atHome
          ? ' · Not yet arrived — scan in at the kiosk'
          : ` · ${ticket.peopleAhead ?? 0} ahead · ~${ticket.estimatedWait ?? meta?.wait} min`}
      </p>
    </div>
  );
}

function NoTicketCard({ onBook }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center">
      <p className="text-sm text-ink-soft">You have no active ticket.</p>
      <button onClick={onBook} className="mt-3 text-sm font-semibold text-brand-700">
        Book a service →
      </button>
    </div>
  );
}

function BookView({ patient, setCode, setView, flash }) {
  const [busy, setBusy] = useState('');
  async function book(service) {
    setBusy(service);
    try {
      const t = await api.createTicket({
        service,
        fullName: patient.fullName,
        idNumber: patient.idNumber,
        mobile: patient.mobile,
        origin: 'mobile',
      });
      setCode(t.code);
      flash(`Booked ${t.code} — scan in at the kiosk when you arrive`);
      setView('checkin');
    } catch (e) {
      flash(e.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <Screen title="Book a service" onBack={() => setView('home')}>
      <div className="space-y-2">
        {SERVICES.map((s) => (
          <button
            key={s.key}
            onClick={() => book(s.key)}
            disabled={!!busy}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left disabled:opacity-50"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Icon name={s.icon} className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-ink">{s.name}</span>
              <span className="block text-[11px] text-ink-faint">~{s.wait} min wait</span>
            </span>
            {busy === s.key && <span className="text-xs text-ink-faint">…</span>}
          </button>
        ))}
      </div>
    </Screen>
  );
}

function CheckinView({ ticket, setView }) {
  if (!ticket) {
    return (
      <Screen title="Check in" onBack={() => setView('home')}>
        <p className="text-sm text-ink-soft">Book a service first, then show your QR at the kiosk.</p>
      </Screen>
    );
  }
  const arrived = ticket.arrivalStatus === 'arrived';
  return (
    <Screen title="Check in" onBack={() => setView('home')}>
      <div className="text-center">
        {arrived ? (
          <>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-600">
              <Icon name="check" className="h-8 w-8" />
            </span>
            <p className="mt-4 font-semibold text-ink">You&apos;re checked in</p>
            <p className="mt-1 text-sm text-ink-soft">
              {ticket.code} · {ticket.peopleAhead ?? 0} ahead · ~{ticket.estimatedWait} min
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto inline-block rounded-xl bg-white p-3 shadow-sm">
              <QRCode2 value={ticket.code} size={160} />
            </div>
            <p className="mt-4 font-semibold text-ink">Show this at the kiosk</p>
            <p className="mt-1 text-sm text-ink-soft">
              Ticket <span className="font-mono font-semibold">{ticket.code}</span>. The kiosk
              &quot;Check in&quot; screen scans it to confirm your arrival.
            </p>
            <p className="mt-3 text-[11px] text-ink-faint">Waiting for scan… updates automatically.</p>
          </>
        )}
      </div>
    </Screen>
  );
}

function ScriptsView({ patient, setView, flash }) {
  const [scripts, setScripts] = useState([]);
  const [med, setMed] = useState('');
  const load = useCallback(() => {
    api.listScripts(patient.fullName).then(setScripts).catch(() => {});
  }, [patient.fullName]);
  useEffect(() => {
    load();
  }, [load]);

  async function request(e) {
    e.preventDefault();
    if (!med.trim()) return;
    try {
      await api.createScript({ patientName: patient.fullName, medication: med.trim() });
      setMed('');
      flash('Script requested');
      load();
    } catch (err) {
      flash(err.message);
    }
  }
  return (
    <Screen title="Repeat scripts" onBack={() => setView('home')}>
      <form onSubmit={request} className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="e.g. Amlodipine 5mg"
          value={med}
          onChange={(e) => setMed(e.target.value)}
        />
        <button className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white">
          Request
        </button>
      </form>
      <div className="mt-4 space-y-2">
        {scripts.length === 0 && <p className="text-sm text-ink-faint">No script requests yet.</p>}
        {scripts.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
            <span className="text-ink">{s.medication}</span>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700">
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function NurseView({ patient, setView, flash }) {
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  async function send(e) {
    e.preventDefault();
    try {
      await api.createNurseRequest({ patientName: patient.fullName, reason: reason.trim() || null });
      setSent(true);
      flash('Nurse callback requested');
    } catch (err) {
      flash(err.message);
    }
  }
  return (
    <Screen title="Nurse line" onBack={() => setView('home')}>
      {sent ? (
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-600">
            <Icon name="check" className="h-7 w-7" />
          </span>
          <p className="mt-3 font-semibold text-ink">A nurse will call you back</p>
          <p className="mt-1 text-sm text-ink-soft">Your request is in the queue.</p>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <p className="text-sm text-ink-soft">Request a callback from a triage nurse.</p>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            rows={3}
            placeholder="Briefly, what do you need help with? (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button className="btn-primary w-full">Request callback</button>
        </form>
      )}
    </Screen>
  );
}

function SosView({ patient, setView, flash }) {
  const [selected, setSelected] = useState('cardiac');
  const [dispatched, setDispatched] = useState(null);

  // Once an SOS is sent, poll the real emergency so the screen reflects what the
  // paramedic enters on the /ambulance page (name, ETA, bay) instead of a mock.
  useEffect(() => {
    if (!dispatched?.code) return undefined;
    let alive = true;
    const tick = async () => {
      try {
        const em = await api.getEmergency(dispatched.code);
        if (alive) setDispatched(em);
      } catch {
        /* keep last known state */
      }
    };
    const t = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [dispatched?.code]);

  async function send() {
    try {
      const em = await api.createEmergency({
        type: selected,
        origin: 'mobile',
        note: `Mobile SOS · ${patient.fullName} · GPS + health passport attached`,
      });
      setDispatched(em);
      flash(`SOS sent — ${em.code}`);
    } catch (err) {
      flash(err.message);
    }
  }
  if (dispatched) {
    const accepted = dispatched.dispatchStatus && dispatched.dispatchStatus !== 'unassigned';
    const crewLine = accepted
      ? `Paramedic ${dispatched.paramedic ?? 'crew'} accepted${
          dispatched.etaMinutes != null ? ` · ETA ${dispatched.etaMinutes} min` : ''
        }`
      : 'Alerting nearest crew · awaiting paramedic…';
    const address = patient?.address ?? '14 Mangaung Ave';
    return (
      <Screen title="SOS" onBack={() => setView('home')}>
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center text-red-600">
            <Icon name="ambulance" className="h-12 w-12" />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-red-600">Ambulance on the way</h2>

          <div className="mt-5 rounded-2xl bg-red-100/70 px-4 py-3 text-left">
            <p className="font-bold text-red-700">
              {dispatched.code} · Priority {dispatched.priority}
            </p>
            <p className="text-sm text-red-600/90">{crewLine}</p>
          </div>

          <div className="mt-4 space-y-2 rounded-2xl bg-brand-50 px-4 py-4 text-left text-sm text-ink-soft">
            <p className="flex items-center gap-2">
              <Icon name="pin" className="h-4 w-4 text-brand-600" /> {address} shared
            </p>
            <p className="flex items-center gap-2">
              <Icon name="heart-pulse" className="h-4 w-4 text-brand-600" /> Health passport sent
            </p>
            <p className="flex items-center gap-2">
              <Icon name="bell" className="h-4 w-4 text-brand-600" />{' '}
              {dispatched.destinationBay != null
                ? `Trauma bay ${dispatched.destinationBay} pre-alerted`
                : 'Trauma bay being prepared'}
            </p>
          </div>

          <button
            onClick={() => setView('home')}
            className="mt-5 w-full rounded-2xl border border-slate-200 py-3 text-sm font-bold text-ink hover:bg-slate-50"
          >
            Back to app
          </button>
        </div>
      </Screen>
    );
  }
  return (
    <Screen title="Emergency SOS" onBack={() => setView('home')}>
      <p className="text-sm text-ink-soft">What is happening?</p>
      <div className="mt-2 space-y-1.5">
        {EMERGENCY_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setSelected(t.key)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
              selected === t.key ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        onClick={send}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white"
      >
        <Icon name="alert" className="h-4 w-4" /> Send SOS
      </button>
    </Screen>
  );
}

// ---- small building blocks -------------------------------------------------

function Screen({ title, onBack, children }) {
  return (
    <div>
      <button onClick={onBack} className="mb-3 flex items-center gap-1 text-sm text-ink-soft">
        <Icon name="arrow-left" className="h-4 w-4" /> {title}
      </button>
      {children}
    </div>
  );
}

function Action({ label, icon, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 rounded-lg bg-white py-3 text-xs font-semibold text-ink-soft shadow-sm disabled:opacity-40"
    >
      <Icon name={icon} className="h-5 w-5 text-brand-600" />
      {label}
    </button>
  );
}

function Feature({ title, body }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
    </div>
  );
}

function Tag({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-700',
  };
  return <span className={`rounded-full px-2 py-0.5 ${tones[tone]}`}>{children}</span>;
}
