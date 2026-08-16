import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, ShieldAlert, Lock, Search, AlertCircle, Activity } from 'lucide-react'
import { Card } from '../components/ui/primitives'
import { DigitalTwinMini } from '../components/digital-twin/DigitalTwinVisualization'
import { api } from '../lib/api'

export function DoctorDashboardPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [snapshot, setSnapshot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

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
      setError(err.message || 'Failed to load authorized patient directory.')
      setLoading(false)
    }
  }

  const loadSnapshot = async (patientId: string) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getDoctorPatientSnapshot(patientId)
      setSnapshot(data)
    } catch (err: any) {
      setError(err.message || 'Access Denied: Failed to retrieve patient clinical snapshot.')
      setSnapshot(null)
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

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Grania-level consent flags
  const permitted = snapshot?.authorized_categories || []
  const hasAll = permitted.some((c: string) => 
    ["all authorized records", "medical records", "clinical overview", "medical history"].includes(c.toLowerCase())
  )
  const hasMeds = hasAll || permitted.some((c: string) => c.toLowerCase() === "medications")
  const hasLabs = hasAll || permitted.some((c: string) => c.toLowerCase() === "lab reports")

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-navy-900 font-sans">
      {/* Clinician Navigation Bar */}
      <header className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between border-b border-navy-950">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 font-bold">
            ⚕️
          </div>
          <div>
            <h1 className="text-base font-bold leading-none">Clinical Portal</h1>
            <p className="text-[10px] text-navy-400 mt-1">HealthTwin Provider Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/app/dashboard" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Patient Portal View
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-semibold"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left column: Patients selection Sidebar */}
        <aside className="w-full lg:w-80 border-r border-navy-100 bg-white p-4 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-navy-500 uppercase tracking-wider mb-2">Patient Directory</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-navy-400" />
              <input 
                type="text" 
                placeholder="Search patient by name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full rounded-lg border border-navy-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {filteredPatients.length === 0 ? (
              <p className="text-xs text-navy-400 italic p-3 text-center">No authorized patients found.</p>
            ) : (
              filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                    selectedPatientId === p.id 
                      ? 'border-indigo-500 bg-indigo-50/50 font-semibold' 
                      : 'border-slate-100 bg-white hover:border-navy-200'
                  }`}
                >
                  <span className="text-sm font-bold text-navy-900">{p.name}</span>
                  <span className="text-navy-500 font-mono">{p.email}</span>
                  <span className="text-[10px] text-navy-400">DOB: {p.date_of_birth}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Right column: Patient snapshot details */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-navy-500">
              <Activity className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
              <p className="text-sm">Assembling clinical snapshot context...</p>
            </div>
          ) : !snapshot ? (
            <div className="text-center py-16 text-navy-500 border-2 border-dashed border-navy-100 rounded-2xl bg-white max-w-xl mx-auto">
              <ShieldAlert className="h-10 w-10 text-navy-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-navy-900">Select Patient Profile</h3>
              <p className="text-xs text-navy-500 mt-2 max-w-sm mx-auto">
                Authorized patient overview will display here. Permissions are controlled by patient consent grants.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Patient details block */}
              <div className="border-b border-navy-100 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-navy-900">{snapshot.patient.name}</h2>
                  <p className="text-xs text-navy-500 mt-1">
                    DOB: <strong>{snapshot.patient.dob}</strong> &middot; Blood Type: <strong>{snapshot.patient.bloodGroup || 'O+'}</strong>
                  </p>
                </div>
                <div className="flex gap-2">
                  {permitted.map((c: string) => (
                    <span key={c} className="text-[10px] font-mono font-semibold uppercase tracking-wider text-cyan-600 bg-cyan-100/60 border border-cyan-200/50 px-2 py-0.5 rounded">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid 1: Diagnostics and Medications */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Digital Twin Viewport */}
                  <Card className="p-6 bg-white border border-navy-100 shadow-sm">
                    <h3 className="text-base font-bold text-navy-900 mb-4">Anatomical Twin Viewer</h3>
                    <div className="h-80 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden relative">
                      <DigitalTwinMini />
                    </div>
                  </Card>

                  {/* Conditions & Active Diagnoses */}
                  <Card className="p-6 bg-white border border-navy-100">
                    <h3 className="text-base font-bold text-navy-900 mb-4">📋 Diagnoses & Active Conditions</h3>
                    {!hasMeds ? (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl text-navy-500 text-xs font-medium">
                        <Lock className="h-4 w-4 text-navy-400 shrink-0" />
                        Access Restricted: Medical History category consent required.
                      </div>
                    ) : snapshot.conditions.length === 0 ? (
                      <p className="text-sm text-navy-500 italic">No clinical conditions registered.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {snapshot.conditions.map((c: any) => (
                          <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                            <div>
                              <p className="font-semibold text-navy-900 text-sm">{c.name}</p>
                              <p className="text-navy-500 mt-0.5">Recorded: {c.firstRecorded}</p>
                            </div>
                            <span className="text-[9px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded uppercase">
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Laboratory Trends */}
                  <Card className="p-6 bg-white border border-navy-100">
                    <h3 className="text-base font-bold text-navy-900 mb-4">🧪 Laboratory Diagnostic Trends</h3>
                    {!hasLabs ? (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl text-navy-500 text-xs font-medium">
                        <Lock className="h-4 w-4 text-navy-400 shrink-0" />
                        Access Restricted: Lab Reports category consent required.
                      </div>
                    ) : snapshot.labs.length === 0 ? (
                      <p className="text-sm text-navy-500 italic">No lab reports cataloged.</p>
                    ) : (
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
                            {snapshot.labs.map((t: any) => (
                              <tr key={t.name}>
                                <td className="py-3 font-semibold text-navy-900">{t.name}</td>
                                <td className="py-3">
                                  <span className="font-bold text-navy-950">{t.current}</span>
                                  <span className="text-xs text-navy-500 ml-0.5">{t.unit}</span>
                                </td>
                                <td className="py-3 text-xs text-navy-500 font-mono">{t.reference_range || '—'}</td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                                    t.trend === 'increasing' ? 'text-red-600' :
                                    t.trend === 'decreasing' ? 'text-emerald-600' :
                                    'text-navy-600'
                                  }`}>
                                    <span className="capitalize">{t.trend}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Right Column: Timeline & Alerts */}
                <div className="space-y-8">
                  {/* Safety Alerts */}
                  <Card className="p-6 bg-white border border-navy-100">
                    <h3 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
                      ⚠️ Safety Engine Analytics
                    </h3>
                    {!hasMeds ? (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl text-navy-500 text-xs font-medium">
                        <Lock className="h-4 w-4 text-navy-400 shrink-0" />
                        Access Restricted: Consent required.
                      </div>
                    ) : snapshot.alerts.length === 0 ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs">
                        No active safety alert triggers found.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {snapshot.alerts.map((al: any) => (
                          <div key={al.id} className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs">
                            <p className="font-bold text-red-800 flex items-center gap-1.5">
                              <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                              {al.title}
                            </p>
                            <p className="text-red-700 mt-1 leading-normal">{al.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Medications list */}
                  <Card className="p-6 bg-white border border-navy-100">
                    <h3 className="text-base font-bold text-navy-900 mb-4">💊 Active Medications</h3>
                    {!hasMeds ? (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl text-navy-500 text-xs font-medium">
                        <Lock className="h-4 w-4 text-navy-400 shrink-0" />
                        Access Restricted: Medications category consent required.
                      </div>
                    ) : snapshot.medications.length === 0 ? (
                      <p className="text-sm text-navy-500 italic">No active medications cataloged.</p>
                    ) : (
                      <div className="space-y-3">
                        {snapshot.medications.map((m: any) => (
                          <div key={m.id} className="border-b border-navy-50 pb-2.5 last:border-0 last:pb-0 text-xs">
                            <p className="font-semibold text-navy-900 text-sm">{m.name}</p>
                            <p className="text-navy-500 mt-0.5 font-mono">{m.generic_name} — {m.dosage}</p>
                            <p className="text-[10px] text-navy-400 mt-1">Prescribed: {m.start_date} | {m.frequency}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Allergies list */}
                  <Card className="p-6 bg-white border border-navy-100">
                    <h3 className="text-base font-bold text-navy-900 mb-4">🛡️ Documented Allergies</h3>
                    {!hasMeds ? (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl text-navy-500 text-xs font-medium">
                        <Lock className="h-4 w-4 text-navy-400 shrink-0" />
                        Access Restricted: Medical History consent required.
                      </div>
                    ) : snapshot.allergies.length === 0 ? (
                      <p className="text-sm text-navy-500 italic">No documented allergies.</p>
                    ) : (
                      <div className="space-y-3">
                        {snapshot.allergies.map((a: any) => (
                          <div key={a.id} className="flex justify-between items-start border-b border-navy-50 pb-2.5 last:border-0 last:pb-0 text-xs">
                            <div>
                              <p className="font-semibold text-navy-900">{a.allergen}</p>
                              <p className="text-navy-500 mt-0.5">{a.reaction}</p>
                            </div>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              a.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {a.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Clinical Timeline */}
                  <Card className="p-6 bg-white border border-navy-100">
                    <h3 className="text-base font-bold text-navy-900 mb-4">📅 Authorized Timeline Logs</h3>
                    <div className="relative pl-4 border-l border-navy-100 space-y-4 text-xs">
                      {snapshot.timeline.length === 0 ? (
                        <p className="text-navy-400 italic">No timeline events recorded.</p>
                      ) : (
                        snapshot.timeline.map((ev: any) => (
                          <div key={ev.id} className="relative">
                            <span className="absolute -left-[22px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white border border-indigo-500 text-[8px]">
                              {ev.icon}
                            </span>
                            <div>
                              <p className="font-semibold text-navy-900 leading-snug">{ev.title}</p>
                              <p className="text-navy-500 mt-0.5 leading-snug">{ev.description}</p>
                              <time className="text-[10px] text-navy-400 font-semibold block mt-1">{ev.date}</time>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}