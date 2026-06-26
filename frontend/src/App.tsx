import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ChatHome from './pages/ChatHome'
import Settings from './pages/Settings'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Inbox from './pages/Inbox'
import Channels from './pages/Channels'
import ChannelDetail from './pages/ChannelDetail'
import Templates from './pages/Templates'
import Campaigns from './pages/Campaigns'
import Scoring from './pages/Scoring'
import Events from './pages/Events'
import Forms from './pages/Forms'
import LandingPages from './pages/LandingPages'
import Posters from './pages/Posters'
import Members from './pages/Members'
import MemberProfile from './pages/MemberProfile'
import Webinars from './pages/Webinars'
import OfflineEvents from './pages/OfflineEvents'
import Flows from './pages/Flows'
import FlowCanvas from './pages/FlowCanvas'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ChatHome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/channels/:key" element={<ChannelDetail />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/scoring" element={<Scoring />} />
          <Route path="/events" element={<Events />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/landing-pages" element={<LandingPages />} />
          <Route path="/posters" element={<Posters />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:customerId" element={<MemberProfile />} />
          <Route path="/webinars" element={<Webinars />} />
          <Route path="/offline-events" element={<OfflineEvents />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/flows/:id" element={<FlowCanvas />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
