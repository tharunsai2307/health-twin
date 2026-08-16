import { useState, useEffect } from 'react'
import { PageHeader, Card, Button } from '../components/ui/primitives'
import { api } from '../lib/api'
import { Shield, AlertCircle, Save } from 'lucide-react'

const settingsCategories = [
  {
    title: 'Profile',
    description: 'Personal information and health profile settings',
    items: ['Display name', 'Date of birth', 'Blood group', 'Emergency contact'],
  },
  {
    title: 'Privacy',
    description: 'Control how your data is stored and shared',
    items: ['Data retention', 'Anonymous analytics', 'Export my data'],
  },
  {
    title: 'Security',
    description: 'Account security and authentication',
    items: ['Change password', 'Two-factor authentication', 'Active sessions'],
  },
  {
    title: 'Consent',
    description: 'Default consent preferences for new providers',
    items: ['Auto-approve lab uploads', 'AI analysis consent', 'Emergency access rules'],
  },
  {
    title: 'Notifications',
    description: 'Alerts and communication preferences',
    items: ['Safety alerts', 'Lab results ready', 'Consent requests', 'AI insights'],
  },
  {
    title: 'AI Preferences',
    description: 'Configure AI analysis behavior',
    items: ['Insight sensitivity', 'Medication conflict checks', 'Lab trend monitoring'],
  },
]

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((cat) => (
          <Card key={cat.title} hover className="cursor-pointer">
            <h3 className="font-semibold text-navy-900">{cat.title}</h3>
            <p className="mt-1 text-sm text-navy-500">{cat.description}</p>
            <ul className="mt-4 space-y-1.5">
              {cat.items.map((item) => (
                <li key={item} className="text-xs text-navy-400">• {item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Form states
  const [dob, setDob] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [gender, setGender] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyRelation, setEmergencyRelation] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  useEffect(() => {
    api.getProfile()
      .then((data) => {
        setProfile(data)
        setDob(data.date_of_birth || '')
        setBloodGroup(data.blood_group || '')
        setGender(data.gender || '')
        const contact = data.emergency_contact || {}
        setEmergencyName(contact.name || '')
        setEmergencyRelation(contact.relation || '')
        setEmergencyPhone(contact.phone || '')
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load profile details')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await api.updateProfile({
        date_of_birth: dob || undefined,
        blood_group: bloodGroup || undefined,
        gender: gender || undefined,
        emergency_contact: {
          name: emergencyName,
          relation: emergencyRelation,
          phone: emergencyPhone
        }
      })
      setMessage('Profile updated successfully!')
      // Refresh profile data
      const updated = await api.getProfile()
      setProfile(updated)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" subtitle="Loading your medical profile..." />
        <div className="h-48 animate-pulse rounded-2xl bg-navy-50" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your personal health profile information." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form panel */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            {message && (
              <div className="rounded-lg bg-green-50 p-3.5 text-xs text-green-700 border border-green-100 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-100 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={profile?.name || ''}
                  className="mt-1.5 w-full rounded-lg border border-navy-100 bg-navy-50/50 px-4 py-2 text-sm text-navy-800 outline-none"
                  disabled
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  className="mt-1.5 w-full rounded-lg border border-navy-100 bg-navy-50/50 px-4 py-2 text-sm text-navy-800 outline-none"
                  disabled
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-800 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-800 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="border-t border-navy-100 pt-6">
              <h4 className="text-sm font-bold text-navy-900 mb-4">Emergency Contact</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-semibold text-navy-500 uppercase">Contact Name</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. Sarah Smith"
                    className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-navy-500 uppercase">Relation</label>
                  <input
                    type="text"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    placeholder="e.g. Spouse"
                    className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-navy-500 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="e.g. +91 99999 99999"
                    className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
              <Save className="h-4 w-4" />
              {saving ? 'Saving changes...' : 'Save Profile Changes'}
            </Button>
          </form>
        </div>

        {/* Info panel */}
        <div className="space-y-6">
          <Card className="bg-indigo-50/50 border-indigo-100">
            <h4 className="font-semibold text-indigo-900 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Holographic Anatomy Mapping
            </h4>
            <p className="mt-2 text-xs text-indigo-700 leading-relaxed">
              Your profile gender selection affects the default anatomical model loaded in your 3D digital twin scene. Adjusting this settings will load the appropriate Visible male or Visible female structural models.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  )
}