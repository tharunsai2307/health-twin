import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui/primitives'
import { AIInsightCard } from '../components/ui/ContentCards'
import { ExplainabilityPanel } from '../components/ui/Overlays'
import { api } from '../lib/api'

export function AIInsightsPage() {
  const [insights, setInsights] = useState<any[]>([])
  const [selectedInsight, setSelectedInsight] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const loadInsights = async () => {
    setLoading(true)
    try {
      const data = await api.getSafetyAlerts()
      setInsights(data)
    } catch (err) {
      console.error('Failed to load safety alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInsights()
  }, [])

  if (loading && insights.length === 0) {
    return <div className="text-center py-12 text-navy-500">Loading AI health insights...</div>
  }

  return (
    <div>
      <PageHeader
        title="🧠 AI Health Insights"
        subtitle="Intelligence generated from your authorized health records."
      />

      <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
        All AI insights are explainable and intended for decision support — not as a substitute for professional medical judgment.
      </div>

      <div className="space-y-6">
        {insights.length === 0 ? (
          <div className="rounded-xl border border-navy-100 bg-white p-6 text-center text-sm text-navy-500">
            ✅ No critical safety alerts or abnormal trends detected.
          </div>
        ) : (
          insights.map((insight) => (
            <AIInsightCard
              key={insight.id}
              id={insight.id}
              priority={insight.priority}
              title={insight.title}
              detected={insight.detected}
              why={insight.why}
              records={insight.records}
              date={insight.date}
              onViewEvidence={() => setSelectedInsight(insight)}
            />
          ))
        )}
      </div>

      <ExplainabilityPanel
        open={!!selectedInsight}
        onClose={() => setSelectedInsight(null)}
        insight={selectedInsight}
      />
    </div>
  )
}
