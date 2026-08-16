import { useState, useEffect } from 'react'
import { PageHeader, Button } from '../components/ui/primitives'
import { ConsentCard } from '../components/ui/ContentCards'
import { Modal } from '../components/ui/Overlays'
import { api } from '../lib/api'

export function ConsentPage() {
  const [consents, setConsents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showGrantModal, setShowGrantModal] = useState(false)
  
  // Grant consent form state
  const [granteeEmail, setGranteeEmail] = useState('')
  const [dataCategory, setDataCategory] = useState('Medical Records')
  const [permission, setPermission] = useState('Clinical Access')
  const [expiry, setExpiry] = useState('')
  const [grantError, setGrantError] = useState('')
  const [grantLoading, setGrantLoading] = useState(false)

  const loadConsents = async () => {
    setLoading(true)
    try {
      const data = await api.getConsents()
      setConsents(data)
    } catch (err) {
      console.error('Failed to load consents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConsents()
  }, [])

  const handleRevoke = async (consentId: string) => {
    if (!confirm('Are you sure you want to revoke this access consent?')) return
    
    try {
      await api.revokeConsent(consentId)
      loadConsents()
    } catch (err) {
      alert('Failed to revoke consent: ' + (err as Error).message)
    }
  }

  const handleGrantConsent = async (e: React.FormEvent) => {
    e.preventDefault()
    setGrantLoading(true)
    setGrantError('')
    try {
      await api.createConsent(granteeEmail, dataCategory, permission, expiry || undefined)
      setShowGrantModal(false)
      setGranteeEmail('')
      setExpiry('')
      loadConsents()
    } catch (err: any) {
      setGrantError(err.message || 'Failed to grant access')
    } finally {
      setGrantLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="🔐 Your Data. Your Control."
        subtitle="Manage who can access your health information and for how long."
        action={<Button size="sm" onClick={() => setShowGrantModal(true)}>Grant Access</Button>}
      />

      <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
        You have full control over your health data. Revoke access at any time — all changes are logged in your audit trail.
      </div>

      {loading && consents.length === 0 ? (
        <div className="text-center py-12 text-navy-500">Loading consents...</div>
      ) : consents.length === 0 ? (
        <div className="text-center py-12 text-navy-500 border border-dashed border-navy-100 bg-white rounded-xl">No access grants active. Add one using 'Grant Access'.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {consents.map((entry) => (
            <ConsentCard 
              key={entry.id} 
              id={entry.id}
              who={entry.who}
              data={entry.data}
              permission={entry.permission}
              expiry={entry.expiry}
              status={entry.status}
              onManage={() => handleRevoke(entry.id)} 
            />
          ))}
        </div>
      )}

      {/* Grant Access Modal */}
      <Modal open={showGrantModal} onClose={() => setShowGrantModal(false)} title="Grant Medical Access Consent" size="md">
        <form onSubmit={handleGrantConsent} className="space-y-4">
          {grantError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100">
              {grantError}
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-navy-700">Doctor Email Address</label>
            <input 
              type="email" 
              placeholder="doctor.name@demo.healthtwin"
              value={granteeEmail}
              onChange={(e) => setGranteeEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
              required
            />
            <p className="mt-1 text-[10px] text-navy-400">Use 'arun.mehta@demo.healthtwin' to test doctor access.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-navy-700">Data Category</label>
            <select 
              value={dataCategory}
              onChange={(e) => setDataCategory(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
            >
              <option value="Medical Records">Medical Records</option>
              <option value="Lab Reports">Lab Reports</option>
              <option value="Medical History">Medical History</option>
              <option value="All Authorized Records">All Authorized Records</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-navy-700">Permission Level</label>
            <select 
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
            >
              <option value="Clinical Access">Clinical Access</option>
              <option value="Read & Upload">Read & Upload</option>
              <option value="Read Only">Read Only</option>
              <option value="Emergency Only">Emergency Only</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-navy-700">Expiry Date (Optional)</label>
            <input 
              type="date" 
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <Button type="submit" className="w-full mt-4" size="lg" disabled={grantLoading}>
            {grantLoading ? 'Granting...' : 'Authorize & Log Consent'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
