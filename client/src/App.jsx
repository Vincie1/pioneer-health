import { Routes, Route } from 'react-router-dom';
import KioskHome from './pages/KioskHome.jsx';
import ServiceCheckIn from './pages/ServiceCheckIn.jsx';
import TicketConfirmation from './pages/TicketConfirmation.jsx';
import KioskCheckIn from './pages/KioskCheckIn.jsx';
import Emergency from './pages/Emergency.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Mobile from './pages/Mobile.jsx';
import Ambulance from './pages/Ambulance.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<KioskHome />} />
      <Route path="/service/:service" element={<ServiceCheckIn />} />
      <Route path="/ticket/:code" element={<TicketConfirmation />} />
      <Route path="/checkin" element={<KioskCheckIn />} />
      <Route path="/emergency" element={<Emergency />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/mobile" element={<Mobile />} />
      <Route path="/ambulance" element={<Ambulance />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
