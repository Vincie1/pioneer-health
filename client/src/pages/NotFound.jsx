import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';

export default function NotFound() {
  return (
    <Layout>
      <div className="mx-auto mt-16 max-w-md text-center">
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-ink-soft">That screen isn&apos;t part of the kiosk.</p>
        <Link to="/" className="btn-primary mt-8">
          Back to kiosk
        </Link>
      </div>
    </Layout>
  );
}
