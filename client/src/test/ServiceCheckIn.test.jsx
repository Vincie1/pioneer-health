import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ServiceCheckIn from '../pages/ServiceCheckIn.jsx';

function renderService(service) {
  return render(
    <MemoryRouter initialEntries={[`/service/${service}`]}>
      <Routes>
        <Route path="/service/:service" element={<ServiceCheckIn />} />
        <Route path="/" element={<div>home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ServiceCheckIn', () => {
  it('renders the correct service name and wait time', () => {
    renderService('consultation');
    expect(screen.getByRole('heading', { name: /medical consultation/i })).toBeInTheDocument();
    expect(screen.getByText(/estimated wait 24 minutes/i)).toBeInTheDocument();
  });

  it('shows the POPIA privacy note', () => {
    renderService('medication');
    expect(screen.getByText(/protected under popia/i)).toBeInTheDocument();
  });

  it('renders the three check-in fields', () => {
    renderService('virtual');
    expect(screen.getByText(/full name/i)).toBeInTheDocument();
    expect(screen.getByText(/id \/ passport number/i)).toBeInTheDocument();
    expect(screen.getByText(/mobile number/i)).toBeInTheDocument();
  });
});
