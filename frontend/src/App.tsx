import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Inbox from './pages/Inbox'
import Channels from './pages/Channels'
import Templates from './pages/Templates'
import Campaigns from './pages/Campaigns'
import Automations from './pages/Automations'
import Scoring from './pages/Scoring'
import Events from './pages/Events'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/scoring" element={<Scoring />} />
          <Route path="/events" element={<Events />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
