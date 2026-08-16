import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Card, StatusBadge, Button } from '../components/ui/primitives'
import {
  Activity, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { DigitalTwinMini } from '../components/digital-twin/DigitalTwinVisualization'

export function DashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const twinData = await api.getDigitalTwin()
      setData(twinData)
    } catch (err: any) {
      console.error('Failed to load dashboard:', err)
      setError(err.message || 'Failed to load clinical dashboard records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-navy-500">
        <Activity className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm">Assembling clinical command center...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-red-100 bg-red-50 text-center max-w-lg mx-auto my-8">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-850">Failed to Load Dashboard</h3>
        <p className="text-sm text-red-700 mt-2 mb-4">{error}</p>
        <Button variant="secondary" onClick={loadData}>Retry</Button>
      </Card>
    )
  }

  const patient = data?.patient || {}
  const vitals = data?.vitals || []
  const medications = data?.medications || []
  const allergies = data?.allergies || []
  const conditions = data?.conditions || []
  const labs = data?.labs || []
  const alerts = data?.alerts || []
  const timeline = data?.timeline || []
  const recentDocs = data?.recent_docs || []
  const consents = data?.consents || []

  // Helper to format vital value and unit
  const renderVital = (key: string, icon: string, label: string) => {
    const v = vitals.find((item: any) => item.key === key)
    if (!v) {
      return (
        <div key={key} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
          <div className="flex justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            <span className="text-sm">{icon}</span>
          </div>
          <p className="text-sm font-semibold text-slate-500 mt-2">Not recorded</p>
        </div>
      )
    }
    return (
      <div key={key} className="bg-white border border-navy-100 rounded-xl p-4 card-hover shadow-sm">
        <div className="flex justify-between text-navy-400">
          <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
          <span className="text-sm text-indigo-500">{icon}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-navy-900">{v.value}</span>
          <span className="text-xs text-navy-500 font-semibold">{v.unit}</span>
        </div>
        <p className="text-[10px] text-navy-400 mt-1 truncate">Source: {v.source_title}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-navy-100 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 leading-tight">
            Welcome back, {patient.name || 'Patient'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-navy-500">
            <span>Age: <strong className="text-navy-900">{patient.age || '—'}</strong></span>
            <span className="h-1.5 w-1.5 rounded-full bg-navy-300 hidden sm:block" />
            <span>Gender: <strong className="text-navy-900 capitalize">{patient.gender || '—'}</strong></span>
            <span className="h-1.5 w-1.5 rounded-full bg-navy-300 hidden sm:block" />
            <span>Blood Type: <strong className="text-navy-900">{patient.blood_group || '—'}</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/app/twin')} className="flex items-center gap-1.5">
            🧬 Launch 3D Twin
          </Button>
          <Button variant="primary" onClick={() => navigate('/app/records')} className="flex items-center gap-1.5">
            📤 Upload Record
          </Button>
        </div>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {renderVital('heart_rate', '❤️', 'Pulse Rate')}
        {renderVital('blood_pressure', '🩺', 'Blood Pressure')}
        {renderVital('spo2', '🩸', 'SpO2 Level')}
        {renderVital('temperature', '🌡️', 'Temperature')}
        {renderVital('body_weight', '⚖️', 'Body Weight')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Diagnostics & Summary */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Digital Twin Section */}
          <Card className="p-6 bg-white border border-navy-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Anatomical Twin Preview</h3>
                <p className="text-xs text-navy-500">Interactive WebGL simulation driving selected diagnostics.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/app/twin')}>Fullscreen Mode</Button>
            </div>
            <div className="h-80 w-full relative bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
              <DigitalTwinMini />
            </div>
          </Card>

          {/* Active Medications & Allergies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-white border border-navy-100">
              <h3 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
                💊 Active Medications
              </h3>
              <div className="space-y-3">
                {medications.length === 0 ? (
                  <p className="text-sm text-navy-500 italic py-2">No clinical medications recorded.</p>
                ) : (
                  medications.map((med: any) => (
                    <div key={med.id} className="border-b border-navy-50 pb-2.5 last:border-0 last:pb-0">
                      <p className="text-sm font-semibold text-navy-900">{med.name}</p>
                      <p className="text-xs text-navy-500 font-mono mt-0.5">{med.generic_name} — {med.dosage}</p>
                      <p className="text-[10px] text-navy-400 mt-1">Prescribed: {med.start_date} | {med.frequency}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6 bg-white border border-navy-100">
              <h3 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
                🛡️ Active Allergies
              </h3>
              <div className="space-y-3">
                {allergies.length === 0 ? (
                  <p className="text-sm text-navy-500 italic py-2">No recorded allergies.</p>
                ) : (
                  allergies.map((all: any) => (
                    <div key={all.id} className="flex justify-between items-start border-b border-navy-50 pb-2.5 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{all.allergen}</p>
                        <p className="text-xs text-navy-500 mt-0.5">{all.reaction}</p>
                      </div>
                      <StatusBadge status={all.severity === 'high' ? 'danger' : all.severity === 'medium' ? 'warning' : 'info'} label={all.severity} />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Active Diagnoses / Conditions */}
          <Card className="p-6 bg-white border border-navy-100">
            <h3 className="text-base font-bold text-navy-900 mb-4">📋 Diagnoses & Active Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conditions.length === 0 ? (
                <p className="text-sm text-navy-500 italic col-span-2">No clinical conditions registered.</p>
              ) : (
                conditions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{c.condition}</p>
                      <p className="text-xs text-navy-500 mt-0.5">Diagnosed: {c.diagnosed_date}</p>
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-cyan-700 bg-cyan-100/60 px-2 py-0.5 rounded uppercase">
                      {c.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Non-Vital Lab Trends Table */}
          <Card className="p-6 bg-white border border-navy-100">
            <h3 className="text-base font-bold text-navy-900 mb-4">🧪 Non-Vital Laboratory Trends</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-navy-100 text-xs text-navy-400 font-semibold uppercase">
                    <th className="pb-3">Test Name</th>
                    <th className="pb-3">Latest Reading</th>
                    <th className="pb-3">Normal Range</th>
                    <th className="pb-3">Trend Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {labs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-sm text-navy-500 italic">No non-vital laboratory readings available.</td>
                    </tr>
                  ) : (
                    labs.map((t: any) => (
                      <tr key={t.name}>
                        <td className="py-3 font-semibold text-navy-900">{t.name}</td>
                        <td className="py-3">
                          <span className="font-bold text-navy-950">{t.current}</span>
                          <span className="text-xs text-navy-500 font-medium ml-0.5">{t.unit}</span>
                        </td>
                        <td className="py-3 text-xs text-navy-500 font-mono">{t.reference_range || '—'}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            t.trend === 'increasing' ? 'text-red-600' :
                            t.trend === 'decreasing' ? 'text-emerald-600' :
                            t.trend === 'stable' ? 'text-navy-600' : 'text-navy-400'
                          }`}>
                            {t.trend === 'increasing' ? <ArrowUpRight className="h-3.5 w-3.5" /> :
                             t.trend === 'decreasing' ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
                            <span className="capitalize">{t.trend}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Timeline, Safety & Consents */}
        <div className="space-y-8">
          {/* Clinical Safety Alerts */}
          <Card className="p-6 bg-white border border-navy-100">
            <h3 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
              ⚠️ Safety Engine Warnings
            </h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  No safety issues or interactions found.
                </div>
              ) : (
                alerts.map((al: any) => (
                  <div key={al.id} className="p-3.5 bg-red-50 border border-red-100 rounded-xl">
                    <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                      {al.title}
                    </div>
                    <p className="text-xs text-red-700 mt-1 leading-normal">{al.description}</p>
                    <p className="text-[9px] text-red-500 font-semibold mt-2 uppercase tracking-wide">
                      Safety Warning: Consult physician before making changes
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Health History Timeline */}
          <Card className="p-6 bg-white border border-navy-100">
            <h3 className="text-base font-bold text-navy-900 mb-4">📅 Recent Clinical Activity</h3>
            <div className="relative pl-4 border-l border-navy-100 space-y-5">
              {timeline.length === 0 ? (
                <p className="text-sm text-navy-400 italic py-2">No timeline events recorded.</p>
              ) : (
                timeline.slice(0, 4).map((item: any) => (
                  <div key={item.id} className="relative">
                    <span className="absolute -left-[22px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white border-2 border-indigo-500 text-[8px]">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{item.title}</p>
                      <p className="text-xs text-navy-500 mt-0.5">{item.description}</p>
                      <time className="text-[10px] text-navy-400 font-semibold block mt-1">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </time>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recently Verified Records */}
          <Card className="p-6 bg-white border border-navy-100">
            <h3 className="text-base font-bold text-navy-900 mb-4">📄 Verified Documents Vault</h3>
            <div className="space-y-3">
              {recentDocs.length === 0 ? (
                <p className="text-sm text-navy-500 italic py-2">No documents cataloged in secure storage.</p>
              ) : (
                recentDocs.slice(0, 3).map((doc: any) => (
                  <div key={doc.id} className="flex items-start gap-3 border-b border-navy-50 pb-2.5 last:border-0 last:pb-0">
                    <div className="text-lg bg-slate-50 border border-slate-100 p-2 rounded-lg shrink-0">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate">{doc.title}</p>
                      <p className="text-xs text-navy-500 font-mono uppercase truncate">{doc.record_type} | {doc.source}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Consent and Security info */}
          <Card className="p-6 bg-white border border-navy-100">
            <h3 className="text-base font-bold text-navy-900 mb-2 flex items-center gap-2">
              🛡️ Data Sharing Consent
            </h3>
            <p className="text-xs text-navy-500 mb-4">Authorized providers currently monitoring your digital twin profile.</p>
            <div className="space-y-2">
              {consents.length === 0 ? (
                <p className="text-xs text-navy-400 italic">No sharing permissions granted.</p>
              ) : (
                consents.slice(0, 2).map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="font-semibold text-navy-800">{c.doctor_name}</span>
                    <span className="font-mono text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">{c.data_category}</span>
                  </div>
                ))
              )}
            </div>
            <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => navigate('/app/consent')}>
              Manage Permissions
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}