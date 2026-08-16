import { useState, useEffect } from 'react'
import { Phone } from 'lucide-react'
import { PageHeader, Card } from '../components/ui/primitives'
import { api } from '../lib/api'

export function EmergencyProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadEmergencyProfile = async () => {
    setLoading(true)
    try {
      const data = await api.getEmergencyProfile()
      setProfile(data)
    } catch (err) {
      console.error('Failed to load emergency profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmergencyProfile()
  }, [])

  if (loading || !profile) {
    return <div className="text-center py-12 text-navy-500">Loading emergency health profile...</div>
  }

  const contact = profile.emergencyContact || {}

  return (
    <div>
      <PageHeader
        title="🚑 Emergency Health Profile"
        subtitle="Critical information for emergency responders."
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-2 border-red-200 bg-red-50/30">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-red-600">Blood Group</p>
            <p className="mt-1 text-5xl font-bold text-red-700">{profile.bloodGroup || '—'}</p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-red-700">⚠️ Critical Allergies</h3>
          <ul className="mt-4 space-y-3">
            {profile.criticalAllergies && profile.criticalAllergies.length === 0 ? (
              <li className="rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-500">No critical allergies documented.</li>
            ) : (
              profile.criticalAllergies && profile.criticalAllergies.map((allergy: string) => (
                <li key={allergy} className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                  {allergy}
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-navy-900">💊 Current Critical Medications</h3>
          <ul className="mt-4 space-y-2">
            {profile.criticalMedications && profile.criticalMedications.length === 0 ? (
              <li className="rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-500">No critical medications.</li>
            ) : (
              profile.criticalMedications && profile.criticalMedications.map((med: string) => (
                <li key={med} className="rounded-lg bg-cyan-50 px-4 py-3 text-sm text-cyan-900">{med}</li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-navy-900">🩺 Major Conditions</h3>
          <ul className="mt-4 space-y-2">
            {profile.majorConditions && profile.majorConditions.length === 0 ? (
              <li className="rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-500">No active major conditions.</li>
            ) : (
              profile.majorConditions && profile.majorConditions.map((condition: string) => (
                <li key={condition} className="rounded-lg bg-navy-50 px-4 py-3 text-sm font-medium text-navy-800">{condition}</li>
              ))
            )}
          </ul>
        </Card>

        {contact.name && (
          <Card className="border-2 border-indigo-200">
            <h3 className="text-lg font-bold text-navy-900">📞 Emergency Contact</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                {contact.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-navy-900">{contact.name}</p>
                <p className="text-sm text-navy-500">{contact.relation}</p>
              </div>
              <a
                href={`tel:${contact.phone}`}
                className="ml-auto flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
