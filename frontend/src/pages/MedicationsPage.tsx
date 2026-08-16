import { useState, useEffect } from 'react'
import { PageHeader, Card, StatusBadge } from '../components/ui/primitives'
import { MedicationCard } from '../components/ui/HealthCards'
import { api } from '../lib/api'

export function MedicationsPage() {
  const [meds, setMeds] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadMedications = async () => {
    setLoading(true)
    try {
      const data = await api.getMedications()
      setMeds(data.active || [])
      setHistory(data.history || [])
    } catch (err) {
      console.error('Failed to load medications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedications()
  }, [])

  if (loading && meds.length === 0) {
    return <div className="text-center py-12 text-navy-500">Loading medications...</div>
  }

  return (
    <div>
      <PageHeader
        title="Medications"
        subtitle="Your current and historical medication records."
      />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-navy-900">Current Medications</h2>
        {meds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-navy-100 bg-white p-6 text-center text-sm text-navy-500">
            No active medications prescribed.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meds.map((med) => (
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
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-navy-900">Medication History</h2>
        <Card>
          <div className="overflow-x-auto">
            {history.length === 0 ? (
              <div className="text-center py-6 text-sm text-navy-500">No historical medications recorded.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-100 text-left text-xs font-medium uppercase tracking-wider text-navy-400">
                    <th className="pb-3 pr-4">Medication</th>
                    <th className="pb-3 pr-4">Change</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-navy-50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-navy-900">{item.name}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge
                          status={item.change === 'Stopped' ? 'stopped' : 'changed'}
                          label={item.change}
                        />
                      </td>
                      <td className="py-3 pr-4 text-navy-600">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 text-navy-500">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </section>
    </div>
  )
}

export function AllergiesConditionsPage() {
  const [allergies, setAllergies] = useState<any[]>([])
  const [conditions, setConditions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadAllergiesConditions = async () => {
    setLoading(true)
    try {
      const data = await api.getAllergiesConditions()
      setAllergies(data.allergies || [])
      setConditions(data.conditions || [])
    } catch (err) {
      console.error('Failed to load allergies & conditions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllergiesConditions()
  }, [])

  if (loading && allergies.length === 0) {
    return <div className="text-center py-12 text-navy-500">Loading critical allergies & conditions...</div>
  }

  return (
    <div>
      <PageHeader title="Allergies & Conditions" subtitle="Critical health information at a glance." />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-navy-900">Known Allergies</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {allergies.length === 0 ? (
            <div className="col-span-2 rounded-xl border border-dashed border-navy-100 bg-white p-6 text-center text-sm text-navy-500">
              No documented allergies.
            </div>
          ) : (
            allergies.map((allergy) => (
              <Card key={allergy.id} hover>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-navy-900">{allergy.allergen}</h3>
                    <p className="mt-1 text-sm text-navy-600">{allergy.reaction}</p>
                  </div>
                  <StatusBadge status={allergy.severity} label={`${allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)} severity`} />
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-navy-900">Conditions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conditions.length === 0 ? (
            <div className="col-span-3 rounded-xl border border-dashed border-navy-100 bg-white p-6 text-center text-sm text-navy-500">
              No documented active medical conditions.
            </div>
          ) : (
            conditions.map((condition) => (
              <Card key={condition.id} hover>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-navy-900">{condition.condition}</h3>
                  <StatusBadge status={condition.status} dot />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-navy-400">First recorded</p>
                    <p className="font-medium text-navy-700">
                      {condition.diagnosed_date ? new Date(condition.diagnosed_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-navy-400">Last updated</p>
                    <p className="font-medium text-navy-700">
                      {condition.diagnosed_date ? new Date(condition.diagnosed_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  )
}