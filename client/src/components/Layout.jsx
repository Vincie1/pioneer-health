import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

// Shared kiosk shell: brand header bar + footer tagline.
export function Layout({ children, variant = 'kiosk' }) {
  return (
    <div className="flex min-h-full flex-col">
      <Header variant={variant} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-12">{children}</main>
      <Footer />
    </div>
  );
}

function Header({ variant }) {
  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
            <Icon name="heart" className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-wide text-ink">
              PIONEER HEALTH
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-brand-600">
              Better care. Faster.
            </span>
          </span>
        </Link>

        {variant === 'dashboard' ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs font-medium text-ink-soft">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
              </span>
              Live • Bloemfontein Clinic
            </span>
            <Link to="/" className="btn-ghost">
              Kiosk
            </Link>
          </div>
        ) : (
          <div className="hidden items-center gap-4 sm:flex">
            <Link
              to="/mobile"
              className="text-xs font-medium text-ink-faint hover:text-ink-soft"
            >
              Mobile app
            </Link>
            <Link
              to="/dashboard"
              className="text-xs font-medium text-ink-faint hover:text-ink-soft"
            >
              Staff dashboard
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-6 text-center text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
        Healthier people. Stronger communities.
      </div>
    </footer>
  );
}
