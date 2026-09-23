import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KioskHome from '../pages/KioskHome.jsx';
import { SERVICES } from '../lib/constants.js';

function renderAt(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('KioskHome', () => {
  it('shows the welcome heading', () => {
    renderAt(<KioskHome />);
    expect(screen.getByRole('heading', { name: /self-service kiosk/i })).toBeInTheDocument();
  });

  it('renders all four services', () => {
    renderAt(<KioskHome />);
    for (const s of SERVICES) {
      expect(screen.getByText(s.name)).toBeInTheDocument();
    }
  });

  it('shows the emergency call to action', () => {
    renderAt(<KioskHome />);
    expect(screen.getByRole('link', { name: /get emergency assistance/i })).toBeInTheDocument();
  });
});
