import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface DigitalTwinVisualizationProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
}

const nodes = [
  { id: 'meds', label: 'Medications', icon: '💊', angle: 0 },
  { id: 'labs', label: 'Lab Results', icon: '🧪', angle: 60 },
  { id: 'conditions', label: 'Conditions', icon: '🩺', angle: 120 },
  { id: 'allergies', label: 'Allergies', icon: '⚠️', angle: 180 },
  { id: 'history', label: 'Medical History', icon: '📋', angle: 240 },
  { id: 'trends', label: 'Health Trends', icon: '📈', angle: 300 },
]

export function DigitalTwinVisualization({ size = 'md', className, animated = true }: DigitalTwinVisualizationProps) {
  const dimensions = { sm: 280, md: 380, lg: 480 }
  const dim = dimensions[size]
  const center = dim / 2
  const radius = dim * 0.38

  return (
    <div className={cn('relative mx-auto', className)} style={{ width: dim, height: dim }}>
      <svg className="absolute inset-0" width={dim} height={dim}>
        {nodes.map((node) => {
          const rad = (node.angle * Math.PI) / 180
          const x = center + radius * Math.cos(rad - Math.PI / 2)
          const y = center + radius * Math.sin(rad - Math.PI / 2)
          return (
            <motion.line
              key={node.id}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="url(#lineGrad)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
              animate={animated ? { pathLength: 1, opacity: 0.6 } : undefined}
              transition={{ duration: 1.2, delay: 0.2 }}
            />
          )
        })}
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center core */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
        animate={animated ? { scale: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.6 }}
      >
        <div className="relative">
          <div className="animate-pulse-ring absolute inset-0 rounded-full bg-indigo-400/20" style={{ margin: -12 }} />
          <div className="animate-pulse-ring absolute inset-0 rounded-full bg-cyan-400/10" style={{ margin: -24, animationDelay: '1s' }} />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-navy-900 via-indigo-700 to-cyan-600 shadow-xl shadow-indigo-200/50">
            <div className="text-center">
              <span className="text-2xl">🧬</span>
              <p className="mt-0.5 text-[10px] font-semibold text-white/90">Health Twin</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Orbital nodes */}
      {nodes.map((node, i) => {
        const rad = (node.angle * Math.PI) / 180
        const x = center + radius * Math.cos(rad - Math.PI / 2)
        const y = center + radius * Math.sin(rad - Math.PI / 2)

        return (
          <motion.div
            key={node.id}
            className="absolute"
            style={{ left: x - 36, top: y - 28 }}
            initial={animated ? { opacity: 0, scale: 0.5 } : undefined}
            animate={animated ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
          >
            <div className="flex w-[72px] flex-col items-center gap-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white bg-white text-lg shadow-md shadow-navy-100/50">
                {node.icon}
              </div>
              <span className="text-center text-[10px] font-medium leading-tight text-navy-600">{node.label}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export function DigitalTwinMini() {
  return (
    <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-navy-50 via-indigo-50/50 to-cyan-50 p-8">
      <DigitalTwinVisualization size="md" />
    </div>
  )
}
