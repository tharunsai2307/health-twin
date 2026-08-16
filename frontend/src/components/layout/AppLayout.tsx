import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { Sidebar, MobileNav } from './Sidebar'
import { DemoBanner } from '../ui/primitives'
import { DEMO_PATIENT } from '../../data/mockData'
import { getUserName } from '../../lib/api'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <DemoBanner />
      <div className="flex flex-1">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className="flex flex-1 flex-col pb-16 lg:pb-0">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-navy-100 bg-white/80 px-4 backdrop-blur-md lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-navy-900 to-indigo-600 text-xs">
                🧬
              </div>
              <span className="text-sm font-bold text-navy-900">HealthTwin</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 rounded-lg border border-navy-100 bg-navy-50/50 px-3 py-1.5">
              <Search className="h-4 w-4 text-navy-400" />
              <input
                type="text"
                placeholder="Search health records..."
                className="w-64 bg-transparent text-sm text-navy-800 placeholder:text-navy-400 outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="relative rounded-lg p-2 text-navy-500 hover:bg-navy-50">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {(() => {
                    const name = getUserName() || DEMO_PATIENT.name;
                    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                  })()}
                </div>
                <span className="hidden text-sm font-medium text-navy-800 sm:block">
                  {(() => {
                    const name = getUserName() || DEMO_PATIENT.name;
                    return name.split(' ')[0];
                  })()}
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
