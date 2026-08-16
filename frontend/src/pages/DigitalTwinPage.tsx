import { useState, useEffect } from 'react'
import { PageHeader, Card, StatusBadge } from '../components/ui/primitives'
import { DigitalTwinVisualization } from '../components/digital-twin/DigitalTwinVisualization'
import { api } from '../lib/api'

export function DigitalTwinPage() {
  const [twinData, setTwinData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadTwinData = async () => {
    setLoading(true)
    try {
      const data = await api.getDigitalTwin()
      setTwinData(data)
    } catch (err) {
      console.error('Failed to load digital twin data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTwinData()
  }, [])

  if (loading || !twinData) {
    return <div className="text-center py-12 text-navy-500">Loading your Digital Health Twin...</div>
  }

  const summary = twinData.twin_summary || {}
  const conditions = summary.conditions || []
  const medications = summary.medications || []
  const allergies = summary.allergies || []
  const recentProcedure = summary.recent_procedure || 'No recent procedure'

  return (
    <div>
      <PageHeader
        title="🧬 Digital Health Twin"
        subtitle="A living view of your healthcare history and current medical context."
      />

      <div className="rounded-2xl border border-navy-100 bg-gradient-to-br from-white via-indigo-50/30 to-cyan-50/20 p-8 lg:p-12">
        <DigitalTwinVisualization size="lg" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Current Health Context */}
        <Card>
          <h3 className="text-lg font-semibold text-navy-900">Current Health Context</h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-navy-400">Conditions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {conditions.length === 0 ? (
                  <span className="text-sm text-navy-400">No active conditions.</span>
                ) : (
                  conditions.map((c: string, idx: number) => (
                    <span key={idx} className="rounded-lg bg-navy-50 px-3 py-1.5 text-sm text-navy-700">{c}</span>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-navy-400">Medications</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {medications.length === 0 ? (
                  <span className="text-sm text-navy-400">No active medications.</span>
                ) : (
                  medications.slice(0, 4).map((m: string, idx: number) => (
                    <span key={idx} className="rounded-lg bg-cyan-50 px-3 py-1.5 text-sm text-cyan-800">{m}</span>
                  ))
                )}
                {medications.length > 4 && (
                  <span className="rounded-lg bg-navy-50 px-3 py-1.5 text-sm text-navy-500">+{medications.length - 4} more</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-navy-400">Allergies</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {allergies.length === 0 ? (
                  <span className="text-sm text-navy-400">No documented allergies.</span>
                ) : (
                  allergies.map((a: string, idx: number) => (
                    <span key={idx} className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700">{a}</span>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-navy-400">Recent Procedures</p>
              <p className="mt-2 text-sm text-navy-700">{recentProcedure}</p>
            </div>
          </div>
        </Card>

        {/* Medical Profile */}
        <Card>
          <h3 className="text-lg font-semibold text-navy-900">Medical Profile</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {[
              { label: 'Blood Group', value: twinData.bloodGroup || '—' },
              { label: 'Age', value: `${twinData.age || 34} years` },
              { label: 'Known Allergies', value: `${allergies.length} documented` },
              { label: 'Active Medications', value: `${medications.length} active` },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-navy-50 p-4">
                <p className="text-xs text-navy-400">{item.label}</p>
                <p className="mt-1 text-lg font-bold text-navy-900">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Health Signals */}
      <section className="mt-10">
        <h3 className="mb-4 text-lg font-semibold text-navy-900">Health Signals</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {twinData.signals && twinData.signals.map((signal: any) => (
            <Card key={signal.id} hover>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-navy-800">{signal.label}</p>
                <StatusBadge
                  status={signal.status}
                  label={signal.status === 'needs_review' ? 'Needs Review' : signal.status === 'trending' ? 'Trending' : 'Stable'}
                  dot
                />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Changes */}
      <section className="mt-10">
        <h3 className="mb-4 text-lg font-semibold text-navy-900">Recent Changes</h3>
        <div className="space-y-3">
          {twinData.recent_changes && twinData.recent_changes.length === 0 ? (
            <div className="rounded-xl border border-navy-100 bg-white p-4 text-center text-sm text-navy-400">
              No recent changes.
            </div>
          ) : (
            twinData.recent_changes && twinData.recent_changes.map((change: any) => (
              <div key={change.id} className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-lg">
                  {change.type === 'lab' ? '🧪' : '💊'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-navy-900">{change.change}</p>
                  <p className="text-xs text-navy-400">
                    {new Date(change.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
