import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui/primitives'
import { ChartCard } from '../components/ui/ChartCard'
import { api } from '../lib/api'

export function LabTrendsPage() {
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadTrends = async () => {
    setLoading(true)
    try {
      const data = await api.getLabsTrends()
      setTrends(data)
    } catch (err) {
      console.error('Failed to load lab trends:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrends()
  }, [])

  if (loading && trends.length === 0) {
    return <div className="text-center py-12 text-navy-500">Loading health indicator trends...</div>
  }

  return (
    <div>
      <PageHeader
        title="Health Trends"
        subtitle="Understand how your health indicators have changed over time."
      />

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Trend data is for informational purposes only and does not constitute a medical diagnosis.
      </div>

      {trends.length === 0 ? (
        <div className="rounded-xl border border-dashed border-navy-100 bg-white p-6 text-center text-sm text-navy-500">
          No lab trend data recorded.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {trends.map((trend) => (
            <ChartCard key={trend.id} {...trend} />
          ))}
        </div>
      )}
    </div>
  )
}
