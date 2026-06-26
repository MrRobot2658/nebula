import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SettingsModal from './SettingsModal'

export default function AppLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
