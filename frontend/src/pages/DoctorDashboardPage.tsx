import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, UserCheck } from 'lucide-react'
import { PageHeader, Card, StatusBadge, DemoBanner } from '../components/ui/primitives'
import { HealthMetricCard } from '../components/ui/HealthCards'
import { AlertCard } from '../components/ui/HealthCards'
import { MedicationCard } from '../components/ui/HealthCards'
import { ChartCard } from '../components/ui/ChartCard'
import { TimelineItem } from '../components/ui/ContentCards'
import { DigitalTwinMini } from '../components/digital-twin/DigitalTwinVisualization'
import { api } from '../lib/api'

export function DoctorDashboardPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [snapshot, setSnapshot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPatients = async () => {
    setLoading(true)
    setError('')
    try {
      const patientList = await api.getDoctorPatients()
      setPatients(patientList)
      if (patientList.length > 0) {
        setSelectedPatientId(patientList[0].id)
      } else {
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load authorized patients')
      setLoading(false)
    }
  }

  const loadSnapshot = async (patientId: string) => {
    setLoading(true)
    try {
      const data = await api.getDoctorPatientSnapshot(patientId)
      setSnapshot(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load patient health snapshot')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    if (selectedPatientId) {
      loadSnapshot(selectedPatientId)
    }
  }, [selectedPatientId])

  const handleLogout = () => {
    api.logout()
    navigate('/login')
  }

  const doctorStats = snapshot ? [
    { id: 'conditions', label: 'Active Conditions', value: `${snapshot.conditions.length}`, icon: '🩺', color: 'navy' as const },
    { id: 'meds', label: 'Medications', value: `${snapshot.medications.length}`, icon: '💊', color: 'cyan' as const },
    { id: 'allergies', label: 'Allergies', value: `${snapshot.allergies.length}`, icon: '⚠️', color: 'amber' as const },
    { id: 'alerts', label: 'Safety Alerts', value: `${snapshot.alerts.length}`, icon: '🚨', color: 'amber' as const },
    { id: 'reports', label: 'Authorized Labs', value: `${snapshot.labs.length}`, icon: '🧪', color: 'indigo' as const },
  ] : []

  return (
    <div className="min-h-screen bg-surface">
      <DemoBanner />
      <div className="border-b border-navy-100 bg-white px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-indigo-600 text-sm">🩺</div>
            <div>
              <p className="text-sm font-bold text-navy-900">Clinical Portal</p>
              <p className="text-[10px] text-navy-400">HealthTwin Provider View</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/app/dashboard" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
              <ArrowLeft className="h-4 w-4" /> Patient View
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl p-4 lg:p-8">
        {patients.length > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-4">
            <UserCheck className="h-5 w-5 text-indigo-600" />
            <label className="text-sm font-medium text-navy-800">Select Patient:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="rounded-lg border border-navy-200 px-3 py-1.5 text-sm text-navy-900 outline-none focus:border-indigo-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.bloodGroup || 'O+'})</option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-navy-500">Loading patient health snapshot data...</div>
        ) : !snapshot ? (
          <div className="text-center py-12 text-navy-500 border border-dashed border-navy-100 rounded-xl bg-white">
            No authorized patient records found. Patients can grant you access from their 'Consent & Sharing' portal.
          </div>
        ) : (
          <>
            <PageHeader
              title="Clinical Overview"
              subtitle={`Patient: ${snapshot.patient.name} (DOB: ${snapshot.patient.dob}) · Understand the patient context in 30 seconds.`}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {doctorStats.map((stat) => (
                <HealthMetricCard key={stat.id} {...stat} />
              ))}
            </div>

            <section className="mt-10">
              <h2 className="mb-4 text-lg font-semibold text-navy-900">🚨 Priority Alerts</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {snapshot.alerts.length === 0 ? (
                  <div className="lg:col-span-2 rounded-xl border border-navy-100 bg-white p-6 text-center text-sm text-navy-500">
                    ✅ No clinical safety alerts active for this patient.
                  </div>
                ) : (
                  snapshot.alerts.map((alert: any) => (
                    <AlertCard
                      key={alert.id}
                      priority={alert.priority}
                      title={alert.title}
                      description={alert.description}
                    />
                  ))
                )}
              </div>
            </section>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <section>
                <h2 className="mb-4 text-lg font-semibold text-navy-900">💊 Medication Overview</h2>
                <div className="space-y-3">
                  {snapshot.medications.length === 0 ? (
                    <div className="rounded-xl border border-navy-100 bg-white p-4 text-center text-sm text-navy-500">No active medications.</div>
                  ) : (
                    snapshot.medications.slice(0, 3).map((med: any) => (
                      <MedicationCard 
                        key={med.id} 
                        id={med.id}
                        name={med.name}
                        dosage={med.dosage}
                        frequency={med.frequency}
                        startDate={med.start_date}
                        doctor={med.source_record ? med.source_record.source : 'Reconciled'}
                        status="active"
                      />
                    ))
                  )}
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-lg font-semibold text-navy-900">⚠️ Allergies</h2>
                <div className="space-y-3">
                  {snapshot.allergies.length === 0 ? (
                    <div className="rounded-xl border border-navy-100 bg-white p-4 text-center text-sm text-navy-500">No documented allergies.</div>
                  ) : (
                    snapshot.allergies.map((a: any) => (
                      <Card key={a.id}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-navy-900">{a.allergen}</p>
                            <p className="text-sm text-navy-600">{a.reaction}</p>
                          </div>
                          <StatusBadge status={a.severity} label={`${a.severity} severity`} />
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </section>
            </div>

            <section className="mt-10">
              <h2 className="mb-4 text-lg font-semibold text-navy-900">📈 Health Trends</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {snapshot.labs.length === 0 ? (
                  <div className="lg:col-span-2 rounded-xl border border-navy-100 bg-white p-4 text-center text-sm text-navy-500">No trend charts available.</div>
                ) : (
                  snapshot.labs.slice(0, 2).map((t: any) => (
                    <ChartCard key={t.id} {...t} />
                  ))
                )}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-lg font-semibold text-navy-900">🧬 Digital Health Twin</h2>
              <DigitalTwinMini />
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-lg font-semibold text-navy-900">📋 Medical Timeline</h2>
              <div className="max-w-xl">
                {snapshot.timeline.length === 0 ? (
                  <div className="rounded-xl border border-navy-100 bg-white p-4 text-center text-sm text-navy-500">No recent timeline events.</div>
                ) : (
                  snapshot.timeline.map((event: any, i: number) => (
                    <TimelineItem 
                      key={event.id} 
                      id={event.id}
                      date={event.date}
                      type={event.type}
                      title={event.title}
                      description={event.description}
                      source={event.source}
                      status={event.status}
                      icon={event.icon}
                      isLast={i === snapshot.timeline.length - 1} 
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
