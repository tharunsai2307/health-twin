import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { PageHeader, Card, Button, StatusBadge } from '../components/ui/primitives'
import { 
  Users, Shield, FileText, Activity, AlertTriangle, Search, Plus, Database, LogOut, UserPlus
} from 'lucide-react'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [consents, setConsents] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'consents' | 'audit' | 'docs' | 'health'>('metrics')
  
  // Create Physician state
  const [showCreateDoctor, setShowCreateDoctor] = useState(false)
  const [docName, setDocName] = useState('')
  const [docEmail, setDocEmail] = useState('')
  const [docPassword, setDocPassword] = useState('')
  const [docSpecialty, setDocSpecialty] = useState('')
  const [docLicense, setDocLicense] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)
  
  // Filters
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [consentFilter, setConsentFilter] = useState('ALL')
  const [auditSearch, setAuditSearch] = useState('')
  const [auditRoleFilter, setAuditRoleFilter] = useState('ALL')
  const [docSearch, setDocSearch] = useState('')
  const [docStatusFilter, setDocStatusFilter] = useState('ALL')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sData, uData, cData, aData, dData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminConsents(),
        api.getAdminAuditLogs(),
        api.getAdminDocuments()
      ])
      setStats(sData)
      setUsers(uData)
      setConsents(cData)
      setAuditLogs(aData)
      setDocuments(dData)
    } catch (err: any) {
      console.error('Failed to load admin dashboard data:', err)
      setError(err.message || 'Access Denied or Connection Failed. Please log in again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleLogout = () => {
    api.logout()
    navigate('/login')
  }

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    setCreateSuccess(false)
    try {
      await api.createDoctor({
        name: docName,
        email: docEmail,
        password: docPassword,
        specialization: docSpecialty || undefined,
        license_identifier: docLicense || undefined
      })
      setCreateSuccess(true)
      setDocName('')
      setDocEmail('')
      setDocPassword('')
      setDocSpecialty('')
      setDocLicense('')
      // Refresh
      const [sData, uData] = await Promise.all([api.getAdminStats(), api.getAdminUsers()])
      setStats(sData)
      setUsers(uData)
    } catch (err: any) {
      setCreateError(err.message || 'Failed to register physician.')
    } finally {
      setCreateLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white p-6">
        <Activity className="h-10 w-10 text-cyan-400 animate-spin mb-4" />
        <p className="text-sm tracking-wide text-navy-200">Loading Administrator Control Center...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-955 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-navy-300 max-w-md mb-6">{error}</p>
        <Button variant="primary" onClick={() => navigate('/login')}>Return to Login</Button>
      </div>
    )
  }

  // Filter computations
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter
    return matchesSearch && matchesRole
  })

  const filteredConsents = consents.filter(c => {
    const matchesFilter = consentFilter === 'ALL' || c.status === consentFilter.toLowerCase()
    return matchesFilter
  })

  const filteredAudits = auditLogs.filter(l => {
    const matchesSearch = l.actor_name.toLowerCase().includes(auditSearch.toLowerCase()) || 
                          l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          l.patient_name.toLowerCase().includes(auditSearch.toLowerCase())
    const matchesRole = auditRoleFilter === 'ALL' || l.actor_role === auditRoleFilter
    return matchesSearch && matchesRole
  })

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
                          d.patient_name.toLowerCase().includes(docSearch.toLowerCase()) ||
                          d.source.toLowerCase().includes(docSearch.toLowerCase())
    const matchesStatus = docStatusFilter === 'ALL' || d.processing_status === docStatusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-navy-950 text-navy-100 flex flex-col">
      {/* Header bar */}
      <header className="border-b border-navy-900 bg-navy-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 font-bold">
            HT
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">HealthTwin</h1>
            <p className="text-xs text-navy-400">Admin Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Administrator
          </span>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-navy-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 border-r border-navy-900 bg-navy-900/50 p-4 flex flex-col gap-1">
          <p className="text-xs font-bold text-navy-500 px-3 mb-2 tracking-wider uppercase">Menu</p>
          <button 
            onClick={() => setActiveTab('metrics')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${activeTab === 'metrics' ? 'bg-cyan-500/10 text-cyan-400' : 'text-navy-300 hover:bg-navy-900 hover:text-white'}`}
          >
            <Activity className="h-4 w-4" />
            System Metrics
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${activeTab === 'users' ? 'bg-cyan-500/10 text-cyan-400' : 'text-navy-300 hover:bg-navy-900 hover:text-white'}`}
          >
            <Users className="h-4 w-4" />
            User Management
          </button>
          <button 
            onClick={() => setActiveTab('consents')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${activeTab === 'consents' ? 'bg-cyan-500/10 text-cyan-400' : 'text-navy-300 hover:bg-navy-900 hover:text-white'}`}
          >
            <Shield className="h-4 w-4" />
            Consent Monitoring
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${activeTab === 'audit' ? 'bg-cyan-500/10 text-cyan-400' : 'text-navy-300 hover:bg-navy-900 hover:text-white'}`}
          >
            <FileText className="h-4 w-4" />
            Audit & Security Logs
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${activeTab === 'docs' ? 'bg-cyan-500/10 text-cyan-400' : 'text-navy-300 hover:bg-navy-900 hover:text-white'}`}
          >
            <FileText className="h-4 w-4" />
            Documents Processing
          </button>
          <button 
            onClick={() => setActiveTab('health')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${activeTab === 'health' ? 'bg-cyan-500/10 text-cyan-400' : 'text-navy-300 hover:bg-navy-900 hover:text-white'}`}
          >
            <Database className="h-4 w-4" />
            System Configuration
          </button>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* TAB 1: METRICS */}
          {activeTab === 'metrics' && stats && (
            <div className="space-y-6">
              <PageHeader title="System Metrics" subtitle="Real-time clinical registry summary and storage status." />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-navy-900 border-navy-800 text-white flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg"><Users className="h-6 w-6" /></div>
                  <div>
                    <p className="text-xs text-navy-400 font-semibold tracking-wide uppercase">Patients</p>
                    <p className="text-2xl font-bold mt-1">{stats.total_patients}</p>
                  </div>
                </Card>
                <Card className="p-4 bg-navy-900 border-navy-800 text-white flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg"><Users className="h-6 w-6" /></div>
                  <div>
                    <p className="text-xs text-navy-400 font-semibold tracking-wide uppercase">Doctors</p>
                    <p className="text-2xl font-bold mt-1">{stats.total_doctors}</p>
                  </div>
                </Card>
                <Card className="p-4 bg-navy-900 border-navy-800 text-white flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><Shield className="h-6 w-6" /></div>
                  <div>
                    <p className="text-xs text-navy-400 font-semibold tracking-wide uppercase">Active Consents</p>
                    <p className="text-2xl font-bold mt-1">{stats.active_consents}</p>
                  </div>
                </Card>
                <Card className="p-4 bg-navy-900 border-navy-800 text-white flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg"><FileText className="h-6 w-6" /></div>
                  <div>
                    <p className="text-xs text-navy-400 font-semibold tracking-wide uppercase">Processed Docs</p>
                    <p className="text-2xl font-bold mt-1">{stats.documents_processed}</p>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Secondary counts */}
                <Card className="bg-navy-900 border-navy-800 p-6 text-white col-span-2">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">Registry Overview</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="border-b border-navy-800 pb-2 flex justify-between">
                      <span className="text-navy-400">Total System Users</span>
                      <span className="font-bold">{stats.active_users}</span>
                    </div>
                    <div className="border-b border-navy-800 pb-2 flex justify-between">
                      <span className="text-navy-400">Revoked Consents</span>
                      <span className="font-bold">{stats.revoked_consents}</span>
                    </div>
                    <div className="border-b border-navy-800 pb-2 flex justify-between">
                      <span className="text-navy-400">Expired Consents</span>
                      <span className="font-bold">{stats.expired_consents}</span>
                    </div>
                    <div className="border-b border-navy-800 pb-2 flex justify-between">
                      <span className="text-navy-400">Pending Review Files</span>
                      <span className="font-bold">{stats.pending_reviews}</span>
                    </div>
                    <div className="pb-2 flex justify-between col-span-2">
                      <span className="text-navy-400">Total System Audit Events</span>
                      <span className="font-bold">{stats.recent_access_events}</span>
                    </div>
                  </div>
                </Card>

                {/* System actions panel */}
                <Card className="bg-navy-900 border-navy-800 p-6 text-white flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">System Operations</h3>
                    <p className="text-xs text-navy-400 mb-4">Launch administrative setups directly from here.</p>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      variant="primary" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => { setActiveTab('users'); setShowCreateDoctor(true); }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Register New Physician
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => setActiveTab('audit')}
                    >
                      <FileText className="h-4 w-4" />
                      Audit Access Trails
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader title="User Management" subtitle="Manage registered patients and clinical doctors." />
                <Button 
                  variant="primary" 
                  onClick={() => setShowCreateDoctor(!showCreateDoctor)}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {showCreateDoctor ? 'View User Directory' : 'Register Physician'}
                </Button>
              </div>

              {showCreateDoctor ? (
                <Card className="p-6 bg-navy-900 border-navy-800 text-white max-w-xl">
                  <h3 className="text-lg font-bold text-white mb-4">Register New Doctor Account</h3>
                  {createError && (
                    <div className="mb-4 p-3 bg-red-950 border border-red-900 rounded-lg text-sm text-red-400">
                      {createError}
                    </div>
                  )}
                  {createSuccess && (
                    <div className="mb-4 p-3 bg-emerald-950 border border-emerald-900 rounded-lg text-sm text-emerald-400">
                      Physician registered successfully! Credentials saved in active directory.
                    </div>
                  )}
                  <form onSubmit={handleCreateDoctor} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-navy-400 font-semibold block mb-1">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={docName} 
                          onChange={(e) => setDocName(e.target.value)}
                          placeholder="Dr. Priya Sharma"
                          className="w-full rounded-lg bg-navy-950 border border-navy-800 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-navy-400 font-semibold block mb-1">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={docEmail} 
                          onChange={(e) => setDocEmail(e.target.value)}
                          placeholder="physician@demo.healthtwin"
                          className="w-full rounded-lg bg-navy-950 border border-navy-800 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-navy-400 font-semibold block mb-1">Access Password</label>
                      <input 
                        type="password" 
                        required
                        value={docPassword} 
                        onChange={(e) => setDocPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-lg bg-navy-950 border border-navy-800 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-navy-400 font-semibold block mb-1">Specialization</label>
                        <input 
                          type="text" 
                          value={docSpecialty} 
                          onChange={(e) => setDocSpecialty(e.target.value)}
                          placeholder="e.g. Endocrinology"
                          className="w-full rounded-lg bg-navy-950 border border-navy-800 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-navy-400 font-semibold block mb-1">License Identifier</label>
                        <input 
                          type="text" 
                          value={docLicense} 
                          onChange={(e) => setDocLicense(e.target.value)}
                          placeholder="e.g. MC-98765"
                          className="w-full rounded-lg bg-navy-955 border border-navy-800 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <Button type="submit" variant="primary" disabled={createLoading} className="w-full">
                      {createLoading ? 'Registering...' : 'Register Physician Account'}
                    </Button>
                  </form>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Filters bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-500" />
                      <input 
                        type="text" 
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full rounded-lg bg-navy-900 border border-navy-800 pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <select 
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="rounded-lg bg-navy-900 border border-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="PATIENT">Patients</option>
                      <option value="DOCTOR">Physicians</option>
                      <option value="ADMIN">Administrators</option>
                    </select>
                  </div>

                  {/* Users directory Table */}
                  <Card className="bg-navy-900 border-navy-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-navy-300">
                        <thead className="bg-navy-950/80 text-xs font-bold text-navy-400 tracking-wider uppercase border-b border-navy-800">
                          <tr>
                            <th className="px-6 py-4">User Details</th>
                            <th className="px-6 py-4">System Role</th>
                            <th className="px-6 py-4">Profile ID</th>
                            <th className="px-6 py-4">Register Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-850">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-12 text-navy-500">No users found.</td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => (
                              <tr key={u.id} className="hover:bg-navy-850/40 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-navy-850 flex items-center justify-center text-sm font-bold text-cyan-400 border border-navy-700">
                                      {u.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-white leading-snug">{u.name}</p>
                                      <p className="text-xs text-navy-400">{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                    u.role === 'ADMIN' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' :
                                    u.role === 'DOCTOR' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' :
                                    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  }`}>
                                    {u.role === 'DOCTOR' ? 'Physician' : u.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-navy-400">
                                  {u.role === 'DOCTOR' ? u.doctor_id : u.role === 'PATIENT' ? u.patient_id : 'System'}
                                </td>
                                <td className="px-6 py-4 text-xs text-navy-400">
                                  {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONSENT MONITORING */}
          {activeTab === 'consents' && (
            <div className="space-y-6">
              <PageHeader title="Consent Monitoring" subtitle="Granular checks on active data sharing grants." />
              
              <div className="flex gap-2">
                {['ALL', 'ACTIVE', 'REVOKED', 'EXPIRED'].map((s) => (
                  <button 
                    key={s}
                    onClick={() => setConsentFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${consentFilter === s ? 'bg-cyan-500 text-navy-950' : 'bg-navy-900 border border-navy-800 text-navy-300 hover:text-white'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <Card className="bg-navy-900 border-navy-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-navy-300">
                    <thead className="bg-navy-950/80 text-xs font-bold text-navy-400 tracking-wider uppercase border-b border-navy-800">
                      <tr>
                        <th className="px-6 py-4">Patient Name</th>
                        <th className="px-6 py-4">Authorized Physician</th>
                        <th className="px-6 py-4">Data Category</th>
                        <th className="px-6 py-4">Permission</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-850">
                      {filteredConsents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-navy-500">No consents recorded in registry.</td>
                        </tr>
                      ) : (
                        filteredConsents.map((c) => (
                          <tr key={c.id} className="hover:bg-navy-850/40 transition-colors">
                            <td className="px-6 py-4 font-semibold text-white">{c.patient_name}</td>
                            <td className="px-6 py-4 text-white">{c.doctor_name}</td>
                            <td className="px-6 py-4 text-xs font-medium text-cyan-400 font-mono">{c.data_category}</td>
                            <td className="px-6 py-4 text-xs text-navy-400">{c.permission}</td>
                            <td className="px-6 py-4">
                              <StatusBadge status={c.status === 'active' ? 'success' : c.status === 'revoked' ? 'danger' : 'warning'} label={c.status} />
                            </td>
                            <td className="px-6 py-4 text-xs text-navy-400 font-mono">{c.expires_at || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 4: AUDIT & SECURITY LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <PageHeader title="Security Audit Logs" subtitle="Tamper-evident logs of all clinician actions." />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-500" />
                  <input 
                    type="text" 
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search logs by action, clinician, or patient..."
                    className="w-full rounded-lg bg-navy-900 border border-navy-800 pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <select 
                  value={auditRoleFilter}
                  onChange={(e) => setAuditRoleFilter(e.target.value)}
                  className="rounded-lg bg-navy-905 border border-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="PATIENT">Patients</option>
                  <option value="DOCTOR">Physicians</option>
                </select>
              </div>

              <Card className="bg-navy-900 border-navy-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-navy-300">
                    <thead className="bg-navy-950/80 text-xs font-bold text-navy-400 tracking-wider uppercase border-b border-navy-800">
                      <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Clinician/Actor</th>
                        <th className="px-6 py-4">Actor Role</th>
                        <th className="px-6 py-4">Patient Profile</th>
                        <th className="px-6 py-4">Action Log</th>
                        <th className="px-6 py-4">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-850">
                      {filteredAudits.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-navy-500">No audit logs matched filters.</td>
                        </tr>
                      ) : (
                        filteredAudits.map((l) => (
                          <tr key={l.id} className="hover:bg-navy-850/40 transition-colors">
                            <td className="px-6 py-4 text-xs font-mono text-navy-400">
                              {new Date(l.timestamp).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 font-semibold text-white">{l.actor_name}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono uppercase ${
                                l.actor_role === 'DOCTOR' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {l.actor_role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white">{l.patient_name}</td>
                            <td className="px-6 py-4 text-sm font-medium text-navy-200">{l.action}</td>
                            <td className="px-6 py-4 text-xs font-mono text-navy-400">{l.data_category}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: DOCUMENTS */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <PageHeader title="Documents Processing Registry" subtitle="Global health vaults records upload pipeline monitoring." />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-500" />
                  <input 
                    type="text" 
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Search documents by title, source, or patient..."
                    className="w-full rounded-lg bg-navy-900 border border-navy-800 pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <select 
                  value={docStatusFilter}
                  onChange={(e) => setDocStatusFilter(e.target.value)}
                  className="rounded-lg bg-navy-900 border border-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PROCESSED">Processed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <Card className="bg-navy-900 border-navy-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-navy-300">
                    <thead className="bg-navy-950/80 text-xs font-bold text-navy-400 tracking-wider uppercase border-b border-navy-800">
                      <tr>
                        <th className="px-6 py-4">Upload Date</th>
                        <th className="px-6 py-4">Document Title</th>
                        <th className="px-6 py-4">Patient Profile</th>
                        <th className="px-6 py-4">File Type</th>
                        <th className="px-6 py-4">Source Clinic</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-850">
                      {filteredDocs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-navy-500">No documents found.</td>
                        </tr>
                      ) : (
                        filteredDocs.map((d) => (
                          <tr key={d.id} className="hover:bg-navy-850/40 transition-colors">
                            <td className="px-6 py-4 text-xs font-mono text-navy-400">
                              {new Date(d.created_at).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-6 py-4 font-semibold text-white">{d.title}</td>
                            <td className="px-6 py-4 text-white">{d.patient_name}</td>
                            <td className="px-6 py-4 text-xs font-mono text-cyan-400 uppercase">{d.record_type}</td>
                            <td className="px-6 py-4 text-xs text-navy-400">{d.source}</td>
                            <td className="px-6 py-4">
                              <StatusBadge status={
                                d.processing_status === 'PROCESSED' ? 'success' :
                                d.processing_status === 'FAILED' ? 'danger' : 'warning'
                              } label={d.processing_status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 6: CONFIG / HEALTH */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <PageHeader title="System Configuration" subtitle="Runtime application environment properties." />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-navy-900 border-navy-800 p-6 text-white">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Storage & Catalog Status
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-navy-800 pb-2">
                      <span className="text-navy-400">Database Engine</span>
                      <span className="font-semibold text-white">SQLite (Relational)</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-800 pb-2">
                      <span className="text-navy-400">Local Instance Path</span>
                      <span className="font-mono text-xs text-navy-300">backend/healthtwin.db</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-800 pb-2">
                      <span className="text-navy-400">Connected API URI</span>
                      <span className="font-mono text-xs text-navy-300">http://localhost:8000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Environment Mode</span>
                      <span className="text-emerald-400 font-semibold uppercase">Secure Sandbox</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-navy-900 border-navy-800 p-6 text-white">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Cognitive AI Integrations
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-navy-800 pb-2">
                      <span className="text-navy-400">OCR Extraction Model</span>
                      <span className="font-semibold text-white">Gemini-1.5-Flash</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-800 pb-2">
                      <span className="text-navy-400">Safety engine checks</span>
                      <span className="font-semibold text-emerald-400">Operational</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">AI Medical Terminology</span>
                      <span className="font-semibold text-white">ICD-10 Mapped via logic rules</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
