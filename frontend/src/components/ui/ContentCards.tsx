import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { StatusBadge } from './primitives'

interface TimelineItemProps {
  id?: string
  date: string
  type: string
  title: string
  description: string
  source: string
  status: string
  icon: string
  isLast?: boolean
  onClick?: () => void
}

export function TimelineItem({ date, title, description, source, status, icon, isLast, onClick }: TimelineItemProps) {
  const d = new Date(date)
  const day = d.toLocaleDateString('en-IN', { day: '2-digit' })
  const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative flex gap-4 pb-8"
      onClick={onClick}
    >
      {!isLast && (
        <div className="absolute left-[19px] top-10 h-full w-px bg-gradient-to-b from-indigo-200 to-navy-100" />
      )}
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-indigo-50 text-lg shadow-sm ring-2 ring-indigo-100">
        {icon}
      </div>
      <div
        className={cn(
          'flex-1 rounded-xl border border-navy-100 bg-white p-4 shadow-sm transition-all',
          onClick && 'cursor-pointer card-hover',
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-indigo-600">{month} {day}</span>
          <StatusBadge status={status} />
        </div>
        <h3 className="mt-2 font-semibold text-navy-900">{title}</h3>
        <p className="mt-1 text-sm text-navy-600">{description}</p>
        <p className="mt-2 text-xs text-navy-400">Source: {source}</p>
      </div>
    </motion.div>
  )
}

interface DocumentCardProps {
  id?: string
  name: string
  type: string
  date: string
  source: string
  status: string
  onClick?: () => void
}

export function DocumentCard({ name, type, date, source, status, onClick }: DocumentCardProps) {
  const typeIcons: Record<string, string> = {
    Prescriptions: '💊',
    'Lab Reports': '🧪',
    'Hospital Records': '🏥',
    Imaging: '📷',
    'Discharge Summaries': '📋',
    Other: '📄',
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-4 card-hover cursor-pointer"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50 text-xl">
        {typeIcons[type] ?? '📄'}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-navy-900">{name}</h3>
        <p className="text-xs text-navy-500">{type} · {source}</p>
      </div>
      <div className="text-right">
        <StatusBadge status={status} />
        <p className="mt-1 text-xs text-navy-400">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </div>
    </div>
  )
}

interface ConsentCardProps {
  id?: string
  who: string
  data: string
  permission: string
  expiry: string
  status: 'active' | 'restricted'
  onManage?: () => void
}

export function ConsentCard({ who, data, permission, expiry, status, onManage }: ConsentCardProps) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
            {who.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">{who}</h3>
            <p className="text-sm text-navy-500">{data}</p>
          </div>
        </div>
        <StatusBadge status={status} dot label={status === 'active' ? 'Active' : 'Restricted'} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-navy-400">Permission</p>
          <p className="font-medium text-navy-700">{permission}</p>
        </div>
        <div>
          <p className="text-navy-400">Expiry</p>
          <p className="font-medium text-navy-700">{expiry}</p>
        </div>
      </div>
      {onManage && (
        <button onClick={onManage} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Manage Access →
        </button>
      )}
    </div>
  )
}

interface AIInsightCardProps {
  id?: string
  priority: 'high' | 'review' | 'info'
  title: string
  detected: string
  why: string
  records: string[]
  date: string
  onViewEvidence?: () => void
}

export function AIInsightCard({ priority, title, detected, why, records, date, onViewEvidence }: AIInsightCardProps) {
  const config = {
    high: { icon: '🔴', label: 'High Priority', border: 'border-l-red-500' },
    review: { icon: '🟡', label: 'Review', border: 'border-l-amber-500' },
    info: { icon: '🔵', label: 'Information', border: 'border-l-blue-500' },
  }[priority]

  return (
    <div className={cn('rounded-xl border border-navy-100 border-l-4 bg-white p-5 shadow-sm card-hover', config.border)}>
      <div className="flex items-center gap-2">
        <span>{config.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-navy-500">{config.label}</span>
        <span className="ml-auto text-xs text-navy-400">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-navy-900">{title}</h3>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-navy-400">What was detected</p>
          <p className="mt-1 text-sm text-navy-700">{detected}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-navy-400">Why it was detected</p>
          <p className="mt-1 text-sm text-navy-700">{why}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-navy-400">Records involved</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {records.map((r) => (
              <span key={r} className="rounded-md bg-navy-50 px-2 py-1 text-xs text-navy-600">{r}</span>
            ))}
          </div>
        </div>
      </div>
      {onViewEvidence && (
        <button
          onClick={onViewEvidence}
          className="mt-4 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
        >
          View Evidence
        </button>
      )}
    </div>
  )
}
