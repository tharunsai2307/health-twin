import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Dna,
  Clock,
  Pill,
  TrendingUp,
  FileText,
  Brain,
  Shield,
  ScrollText,
  Ambulance,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/twin', label: 'My Health Twin', icon: Dna },
  { to: '/app/timeline', label: 'Medical Timeline', icon: Clock },
  { to: '/app/medications', label: 'Medications', icon: Pill },
  { to: '/app/lab-trends', label: 'Lab Trends', icon: TrendingUp },
  { to: '/app/records', label: 'Health Records', icon: FileText },
  { to: '/app/ai-insights', label: 'AI Insights', icon: Brain },
  { to: '/app/consent', label: 'Consent & Sharing', icon: Shield },
  { to: '/app/audit', label: 'Audit Log', icon: ScrollText },
  { to: '/app/emergency', label: 'Emergency Profile', icon: Ambulance },
]

const bottomItems = [
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/app/profile', label: 'Profile', icon: User },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-navy-100 bg-white transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-navy-100 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-navy-900 to-indigo-600 text-sm">
          🧬
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-navy-900">HealthTwin</p>
            <p className="text-[10px] text-navy-400">Patient Portal</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}

        <div className="my-3 border-t border-navy-100" />

        <NavLink
          to="/doctor"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            location.pathname === '/doctor'
              ? 'bg-cyan-50 text-cyan-700'
              : 'text-navy-600 hover:bg-navy-50',
          )}
        >
          <Stethoscope className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Doctor View</span>}
        </NavLink>
      </nav>

      <div className="border-t border-navy-100 p-3">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50"
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
        <button
          onClick={onToggle}
          className="mt-2 flex w-full items-center justify-center rounded-lg p-2 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const location = useLocation()
  const mobileItems = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/app/twin', icon: Dna, label: 'Twin' },
    { to: '/app/ai-insights', icon: Brain, label: 'AI' },
    { to: '/app/records', icon: FileText, label: 'Records' },
    { to: '/app/settings', icon: Settings, label: 'More' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-navy-100 bg-white lg:hidden">
      {mobileItems.map((item) => {
        const Icon = item.icon
        const active = location.pathname === item.to
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
              active ? 'text-indigo-600' : 'text-navy-400',
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
