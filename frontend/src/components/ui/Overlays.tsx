import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={cn('relative w-full rounded-2xl bg-white shadow-2xl', sizes[size])}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
                <button onClick={onClose} className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface ExplainabilityPanelProps {
  open: boolean
  onClose: () => void
  insight: {
    title: string
    evidence: {
      items: { label: string; detail: string }[]
      sources: { name: string; date: string }[]
    }
  } | null
}

export function ExplainabilityPanel({ open, onClose, insight }: ExplainabilityPanelProps) {
  if (!insight) return null

  return (
    <Drawer open={open} onClose={onClose} title="Why was this flagged?">
      <div className="space-y-6">
        <p className="text-sm text-navy-600">{insight.title}</p>

        <div className="space-y-3">
          {insight.evidence.items.map((item) => (
            <div key={item.label} className="flex gap-3 rounded-lg bg-navy-50 p-3">
              <span className="text-emerald-500">✓</span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-navy-400">{item.label}</p>
                <p className="mt-0.5 text-sm text-navy-800">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navy-900">Source Records</h3>
          <div className="mt-3 space-y-2">
            {insight.evidence.sources.map((s) => (
              <div key={s.name + s.date} className="flex items-center justify-between rounded-lg border border-navy-100 p-3">
                <span className="text-sm font-medium text-navy-800">{s.name}</span>
                <span className="text-xs text-navy-500">{s.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
          AI-generated information is intended for decision support and does not replace professional medical judgment.
        </div>
      </div>
    </Drawer>
  )
}
