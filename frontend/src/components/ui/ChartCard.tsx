import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Card } from './primitives'

interface ChartCardProps {
  name: string
  unit: string
  current: number | string
  date: string
  trend: 'increasing' | 'decreasing' | 'stable'
  data: { date: string; value: number }[]
  className?: string
}

const trendConfig = {
  increasing: { icon: TrendingUp, label: 'Increasing trend', color: 'text-amber-600', stroke: '#f59e0b' },
  decreasing: { icon: TrendingDown, label: 'Decreasing trend', color: 'text-emerald-600', stroke: '#10b981' },
  stable: { icon: Minus, label: 'Stable', color: 'text-cyan-600', stroke: '#06b6d4' },
}

export function ChartCard({ name, unit, current, date, trend, data, className }: ChartCardProps) {
  const config = trendConfig[trend]
  const TrendIcon = config.icon

  return (
    <Card className={cn('', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-navy-900">{name}</h3>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-navy-900">{current}</span>
            <span className="text-sm text-navy-500">{unit}</span>
          </div>
        </div>
        <div className={cn('flex items-center gap-1 text-xs font-medium', config.color)}>
          <TrendIcon className="h-3.5 w-3.5" />
          {config.label}
        </div>
      </div>

      <div className="mt-4 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.stroke} stopOpacity={0.2} />
                <stop offset="100%" stopColor={config.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#627d98' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#627d98' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(value) => [`${value} ${unit}`, name]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={config.stroke}
              strokeWidth={2}
              fill={`url(#grad-${name})`}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs text-navy-400">
        Last updated: {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </Card>
  )
}
