import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart, Activity, Clock, Thermometer, Droplet, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle, Shield
} from 'lucide-react'

import { PageHeader, StatusBadge, Button } from '../components/ui/primitives'

import { DigitalTwinViewer } from '../features/digital-twin'
import { api } from '../lib/api'

export function DigitalTwinPage() {
  const [twinData, setTwinData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.getDigitalTwin()
      .then((data) => {
        if (!cancelled) setTwinData(data)
      })
      .catch((err) => {
        console.error('Failed to load digital twin:', err)
        if (!cancelled) setError(err.message || 'Failed to load clinical context')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Clinical Digital Twin" subtitle="Loading your medical record context..." />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-[450px] animate-pulse rounded-2xl bg-navy-50" />
          <div className="h-[450px] animate-pulse rounded-2xl bg-navy-50" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-800">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-bold">Clinical Digital Twin Offline</h3>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry Connection</Button>
      </div>
    )
  }

  // const patient = twinData?.patient || {}
  const vitals = twinData?.vitals || []
  const medications = twinData?.medications || []
  const allergies = twinData?.allergies || []
  const conditions = twinData?.conditions || []
  const safetyAlerts = twinData?.safety_alerts || []
  const timeline = twinData?.timeline || []
  const labs = twinData?.labs || []
  const records = twinData?.records || []
  const lastUpdated = twinData?.last_updated || ''

  // Helper to render vital icons
  const getVitalIcon = (key: string) => {
    switch (key) {
      case 'heart_rate': return <Heart className="h-5 w-5 text-red-500" />
      case 'blood_pressure': return <Activity className="h-5 w-5 text-indigo-500" />
      case 'spo2': return <Droplet className="h-5 w-5 text-cyan-500" />
      case 'temperature': return <Thermometer className="h-5 w-5 text-orange-500" />
      default: return <Activity className="h-5 w-5 text-navy-500" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Clinical Digital Twin</h1>
          <p className="text-sm text-navy-500">Your real-time anatomical and physiological digital health twin.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-navy-50 px-3.5 py-2 text-xs text-navy-600">
          <Clock className="h-4 w-4 text-navy-400" />
          <span>Last Updated: <strong>{lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}</strong></span>
        </div>
      </div>

      {/* ── 3D Viewport & Interactive Scene ────────────────────────────── */}
      <section aria-label="Anatomical Twin Viewer" className="overflow-hidden rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy-500">Anatomical Visualization</h2>
        <DigitalTwinViewer />
      </section>

      {/* ── Vitals & Health Signals ────────────────────────────────────── */}
      <section aria-label="Vital Signs">
        <h2 className="mb-4 text-base font-bold text-navy-900">Latest Vital Signs</h2>
        {vitals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-navy-100 bg-white p-6 text-center text-sm text-navy-400">
            No active vitals recorded. Add a lab result or diagnostic record containing pulse, BP, or SpO2.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vitals.map((v: any) => (
              <div key={v.key} className="flex flex-col justify-between rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider">{v.label}</span>
                  {getVitalIcon(v.key)}
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-navy-900">{v.value}</span>
                    {v.unit && <span className="text-xs text-navy-400">{v.unit}</span>}
                  </div>
                  <p className="mt-1 text-[10px] text-navy-400 truncate">Source: {v.source_title || 'Direct Entry'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Primary Clinical Blocks (Meds, Allergies, Diagnoses) ───────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Medications */}
        <section className="lg:col-span-2 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-navy-900">Active Medications</h3>
          <div className="mt-4 space-y-3">
            {medications.length === 0 ? (
              <p className="text-sm text-navy-400">No active medications documented.</p>
            ) : (
              medications.map((m: any) => (
                <div key={m.id} className="flex items-start justify-between rounded-xl border border-navy-50 bg-navy-50/50 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-800 text-sm">{m.name}</span>
                      {m.has_safety_alert && (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-medium text-red-700 border border-red-100">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Safety Alert
                        </span>
                      )}
                    </div>
                    {m.generic_name && (
                      <p className="text-xs text-navy-400 mt-0.5">Generic: {m.generic_name}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500">
                      <span>Dosage: <strong>{m.dosage || 'Not specified'}</strong></span>
                      <span>Frequency: <strong>{m.frequency || 'Not specified'}</strong></span>
                    </div>
                    <p className="mt-2 text-[10px] text-navy-400">Source: {m.source_title || 'Prescription Document'}</p>
                  </div>
                  <StatusBadge status={m.status === 'active' ? 'active' : 'restricted'} label={m.status.toUpperCase()} dot />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Clinical Profile & Allergies */}
        <div className="space-y-6">
          {/* Allergies Card */}
          <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-navy-900">Allergies & Sensitivities</h3>
            <div className="mt-4 space-y-3">
              {allergies.length === 0 ? (
                <p className="text-sm text-navy-400">No documented allergies.</p>
              ) : (
                allergies.map((a: any) => (
                  <div key={a.id} className="rounded-xl border border-navy-50 bg-navy-50/30 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-navy-800">{a.allergen}</span>
                      <span className={['rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', 
                        a.severity === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
                        a.severity === 'medium' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                        'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      ].join(' ')}>
                        {a.severity}
                      </span>
                    </div>
                    {a.reaction && <p className="mt-1 text-xs text-navy-500">Reaction: {a.reaction}</p>}
                    <p className="mt-2 text-[9px] text-navy-400">Source: {a.source_title || 'Document'}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Active Diagnoses */}
          <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-navy-900">Documented Diagnoses</h3>
            <div className="mt-4 space-y-2.5">
              {conditions.length === 0 ? (
                <p className="text-sm text-navy-400">No documented diagnoses.</p>
              ) : (
                conditions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-navy-50 p-3">
                    <div>
                      <p className="text-xs font-semibold text-navy-800">{c.condition}</p>
                      <p className="mt-0.5 text-[9px] text-navy-400">
                        Diagnosed: {c.diagnosed_date ? new Date(c.diagnosed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 uppercase">
                      {c.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Lab Trends Section ─────────────────────────────────────────── */}
      <section aria-label="Lab Trends" className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-navy-900">Lab Trends & Historical Stats</h3>
        {labs.length === 0 ? (
          <p className="mt-4 text-sm text-navy-400">No lab results available for analysis.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {labs.map((lab: any) => (
              <div key={lab.id} className="rounded-xl border border-navy-50 bg-navy-50/20 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-navy-500 uppercase tracking-wider">{lab.test_name}</h4>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-xl font-bold text-navy-900">{lab.value}</span>
                      {lab.unit && <span className="text-xs text-navy-400">{lab.unit}</span>}
                    </div>
                  </div>
                  
                  {/* Trend Indicator */}
                  {lab.trend === 'increasing' && (
                    <span className="flex items-center gap-0.5 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                      <ArrowUpRight className="h-4 w-4" />
                      Increasing
                    </span>
                  )}
                  {lab.trend === 'decreasing' && (
                    <span className="flex items-center gap-0.5 rounded-lg bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                      <ArrowDownRight className="h-4 w-4" />
                      Decreasing
                    </span>
                  )}
                  {lab.trend === 'stable' && (
                    <span className="rounded-lg bg-navy-50 px-2 py-1 text-xs font-semibold text-navy-600">
                      Stable
                    </span>
                  )}
                  {lab.trend === 'insufficient_data' && (
                    <span className="rounded-lg bg-navy-50 px-2 py-1 text-[10px] text-navy-400">
                      Single Entry
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-navy-50/60 pt-2 text-[10px] text-navy-400">
                  <span>Ref Range: <strong>{lab.reference_range || 'Not specified'}</strong></span>
                  {lab.previous_value && <span>Previous: <strong>{lab.previous_value} {lab.unit}</strong></span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Safety Alerts & Insights ───────────────────────────────────── */}
      {safetyAlerts.length > 0 && (
        <section aria-label="Clinical Safety Insights" className="rounded-2xl border border-red-100 bg-red-50/30 p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-bold text-red-900">Clinical Safety Insights</h3>
          </div>
          <div className="mt-4 space-y-3">
            {safetyAlerts.map((alert: any) => (
              <div key={alert.id} className="flex items-start gap-3 rounded-xl border border-red-100 bg-white p-4 shadow-sm">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-navy-900">{alert.title}</h4>
                  <p className="mt-1 text-xs text-navy-600 leading-relaxed">{alert.description}</p>
                  <p className="mt-2 text-[9px] text-red-600">Notice: Safety review recommended. Consult your physician.</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Chronological Health Timeline ──────────────────────────────── */}
      <section aria-label="Health Timeline" className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-navy-900">Chronological Health Timeline</h3>
        <div className="relative mt-6 border-l border-navy-100 pl-6 space-y-6">
          {timeline.length === 0 ? (
            <p className="text-sm text-navy-400 pl-2">No timeline events recorded.</p>
          ) : (
            timeline.slice(0, 10).map((item: any, idx: number) => (
              <div key={idx} className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-500 shadow-sm" />
                
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-navy-400 bg-navy-50 px-2 py-0.5 rounded-full uppercase">
                      {item.type}
                    </span>
                    <h4 className="text-sm font-bold text-navy-900">{item.title}</h4>
                  </div>
                  <span className="text-xs text-navy-400">
                    {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-1 text-xs text-navy-500 leading-relaxed max-w-2xl">{item.description}</p>
                )}
                {item.source && (
                  <p className="mt-1 text-[10px] text-navy-400">Source: {item.source}</p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Recent Verified Documents ───────────────────────────────────── */}
      <section aria-label="Verified Documents" className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-navy-900">Recent Verified Health Documents</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {records.length === 0 ? (
            <p className="text-sm text-navy-400">No medical records uploaded.</p>
          ) : (
            records.map((rec: any) => (
              <button
                key={rec.id}
                onClick={() => navigate(`/app/records`)}
                className="flex items-center justify-between rounded-xl border border-navy-50 p-4 text-left transition-all hover:bg-navy-50/50"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-xs font-bold text-navy-800">{rec.title}</h4>
                  <p className="text-[10px] text-navy-400 mt-1">
                    {rec.record_type} &middot; {new Date(rec.record_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>VERIFIED</span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  )
}