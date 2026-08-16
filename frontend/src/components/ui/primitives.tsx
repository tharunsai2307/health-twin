import { type ReactNode } from 'react'
import { cn } from '../../lib/utils'

type Status = 'active' | 'stopped' | 'changed' | 'restricted' | 'verified' | 'needs_review' | 'processing' | 'processed' | 'stable' | 'trending' | 'high' | 'medium' | 'low' | 'safe' | 'review' | 'priority' | 'info' | 'monitoring'

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  stopped: 'bg-slate-100 text-slate-600 ring-slate-200',
  changed: 'bg-amber-50 text-amber-700 ring-amber-200',
  restricted: 'bg-slate-100 text-slate-500 ring-slate-200',
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  needs_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  processing: 'bg-blue-50 text-blue-700 ring-blue-200',
  processed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  stable: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  trending: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  monitoring: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  high: 'bg-red-50 text-red-700 ring-red-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
  safe: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  review: 'bg-amber-50 text-amber-700 ring-amber-200',
  priority: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
}

interface StatusBadgeProps {
  status: Status | string
  label?: string
  dot?: boolean
  className?: string
}

export function StatusBadge({ status, label, dot, className }: StatusBadgeProps) {
  const display = label ?? status.replace(/_/g, ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
        statusStyles[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200',
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            status === 'active' || status === 'verified' || status === 'stable' ? 'bg-emerald-500' :
            status === 'restricted' ? 'bg-slate-400' :
            status === 'needs_review' || status === 'review' ? 'bg-amber-500' :
            status === 'priority' || status === 'high' ? 'bg-red-500' :
            'bg-cyan-500',
          )}
        />
      )}
      {display}
    </span>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-navy-900 text-white hover:bg-navy-800 shadow-sm',
    secondary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    ghost: 'text-navy-700 hover:bg-navy-50',
    outline: 'border border-navy-200 text-navy-800 hover:bg-navy-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-navy-100 bg-white p-5 shadow-sm',
        hover && 'card-hover cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
      </div>
      {action && <div className="mt-3 sm:mt-0">{action}</div>}
    </div>
  )
}

export function DemoBanner() {
  return (
    <div className="bg-navy-900 px-4 py-2 text-center text-xs font-medium tracking-wide text-cyan-400">
      DEMO ENVIRONMENT — NOT REAL MEDICAL DATA
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 text-4xl">{icon}</span>
      <h3 className="text-lg font-semibold text-navy-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-navy-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-200 border-t-indigo-600" />
      <p className="mt-4 text-sm text-navy-500">{message}</p>
    </div>
  )
}
