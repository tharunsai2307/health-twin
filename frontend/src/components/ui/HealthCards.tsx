import { cn } from '../../lib/utils'
import { StatusBadge, Card } from './primitives'

interface HealthMetricCardProps {
  icon: string
  label: string
  value: string
  color?: 'indigo' | 'cyan' | 'amber' | 'navy'
  className?: string
}

const colorMap = {
  indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-100',
  cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-100',
  amber: 'from-amber-500/10 to-amber-600/5 border-amber-100',
  navy: 'from-navy-500/10 to-navy-600/5 border-navy-100',
}

export function HealthMetricCard({ icon, label, value, color = 'navy', className }: HealthMetricCardProps) {
  return (
    <Card className={cn('bg-gradient-to-br card-hover', colorMap[color], className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-navy-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-navy-900">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </Card>
  )
}

interface AlertCardProps {
  priority: 'high' | 'review' | 'info'
  title: string
  description: string
  onViewWhy?: () => void
  className?: string
}

const priorityConfig = {
  high: { icon: '🔴', badge: 'priority' as const, border: 'border-red-200 bg-red-50/50' },
  review: { icon: '🟡', badge: 'review' as const, border: 'border-amber-200 bg-amber-50/50' },
  info: { icon: '🔵', badge: 'info' as const, border: 'border-blue-200 bg-blue-50/50' },
}

export function AlertCard({ priority, title, description, onViewWhy, className }: AlertCardProps) {
  const config = priorityConfig[priority]
  return (
    <Card className={cn('border', config.border, className)} hover={!!onViewWhy} onClick={onViewWhy}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={config.badge} label={priority === 'high' ? 'High Priority' : priority === 'review' ? 'Needs Review' : 'Information'} />
          </div>
          <h3 className="mt-2 font-semibold text-navy-900">{title}</h3>
          <p className="mt-1 text-sm text-navy-600">{description}</p>
          {onViewWhy && (
            <button className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View Why →
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

interface MedicationCardProps {
  id?: string
  name: string
  dosage: string
  frequency: string
  startDate: string
  doctor: string
  status: 'active' | 'stopped' | 'changed'
}

export function MedicationCard({ name, dosage, frequency, startDate, doctor, status }: MedicationCardProps) {
  return (
    <Card hover className="group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-lg">💊</div>
          <div>
            <h3 className="font-semibold text-navy-900">{name}</h3>
            <p className="text-sm text-navy-600">{dosage} · {frequency}</p>
          </div>
        </div>
        <StatusBadge status={status} dot />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-3 text-xs text-navy-500">
        <span>Since {new Date(startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
        <span>{doctor}</span>
      </div>
    </Card>
  )
}
