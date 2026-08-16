import { ArrowLeft, FileText, ExternalLink, Clock, AlertCircle } from 'lucide-react'
import { ORGAN_CONFIGS } from '../organConfig'
import type { OrganId, OrganData } from '../types'

interface MetricRowProps {
  label: string
  value: string
  unit?: string | null
  date?: string
  source?: string | null
  referenceRange?: string | null
}

function MetricRow({ label, value, unit, date, source, referenceRange }: MetricRowProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
      <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">{label}</p>
      <div className="mt-1.5 flex items-end gap-1.5">
        <span className="text-xl font-bold text-white">{value}</span>
        {unit && <span className="mb-0.5 text-xs text-white/50">{unit}</span>}
      </div>
      {referenceRange && (
        <p className="mt-1 text-[10px] text-white/30">Ref: {referenceRange}</p>
      )}
      <div className="mt-2 space-y-0.5">
        {date && (
          <p className="flex items-center gap-1 text-[10px] text-white/35">
            <Clock className="h-2.5 w-2.5" />
            {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
        {source && (
          <p className="flex items-center gap-1 truncate text-[10px] text-white/35">
            <FileText className="h-2.5 w-2.5 shrink-0" />
            {source}
          </p>
        )}
      </div>
    </div>
  )
}

interface OrganDetailPanelProps {
  organ: OrganId
  data: OrganData | null
  loading: boolean
  error: string | null
  onBack: () => void
  onOpenRecord?: (recordId: string) => void
}

export function OrganDetailPanel({ organ, data, loading, error, onBack, onOpenRecord }: OrganDetailPanelProps) {
  const config = ORGAN_CONFIGS[organ]

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e1629]"
         style={{ minHeight: '480px' }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 p-4">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/80"
          aria-label="Back to full body view"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Digital Twin
        </button>
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ background: `${config.color}20`, border: `1px solid ${config.color}35` }}
          >
            {config.emoji}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{config.label}</h3>
            <p className="text-[11px] text-white/40">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Unable to load data</p>
              <p className="mt-0.5 opacity-70">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-5">
            {/* Lab Metrics */}
            {data.metrics.length > 0 ? (
              <section>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                  Lab Metrics
                </p>
                <div className="space-y-2.5">
                  {data.metrics.slice(0, 4).map((m) => (
                    <MetricRow
                      key={m.id}
                      label={m.test_name}
                      value={m.value}
                      unit={m.unit}
                      date={m.test_date}
                      source={m.source_title}
                      referenceRange={m.reference_range}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <div className="rounded-xl border border-white/8 bg-white/4 p-4 text-center">
                <p className="text-xs text-white/40">
                  No {config.label.toLowerCase()}-related lab results recorded yet.
                </p>
              </div>
            )}

            {/* Related Records */}
            {data.records.length > 0 && (
              <section>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                  Related Records
                </p>
                <div className="space-y-2">
                  {data.records.slice(0, 3).map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => onOpenRecord?.(rec.id)}
                      className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/8"
                      aria-label={`Open ${rec.title}`}
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/80">{rec.title}</p>
                        <p className="text-[10px] text-white/35">
                          {rec.source || 'Unknown source'} &middot;{' '}
                          {new Date(rec.record_date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <ExternalLink className="h-3 w-3 shrink-0 text-white/25" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Clinical Events */}
            {data.events.length > 0 && (
              <section>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                  Clinical Events
                </p>
                <div className="space-y-2">
                  {data.events.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="rounded-xl border border-white/10 bg-white/4 p-3">
                      <p className="text-xs font-medium text-white/75">{ev.title}</p>
                      {ev.description && (
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-white/40">
                          {ev.description}
                        </p>
                      )}
                      <p className="mt-1.5 text-[10px] text-white/30">
                        {new Date(ev.event_date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Fully empty state */}
            {data.metrics.length === 0 && data.records.length === 0 && data.events.length === 0 && (
              <div className="rounded-xl border border-white/8 bg-white/4 p-6 text-center">
                <div className="mx-auto mb-3 text-4xl opacity-25">{config.emoji}</div>
                <p className="text-sm font-medium text-white/50">
                  No {config.label} records yet
                </p>
                <p className="mt-1.5 text-xs text-white/30">
                  Upload {config.label.toLowerCase()}-related medical documents to
                  populate this panel with real clinical data.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer attribution */}
      <div className="flex-shrink-0 border-t border-white/8 px-4 py-2.5">
        <p className="text-[9px] text-white/25">
          All values from your verified medical records.
          Clinical review recommended for any health concerns.
        </p>
      </div>
    </div>
  )
}
