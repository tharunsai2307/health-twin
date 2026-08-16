import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui/primitives'
import { HealthMetricCard } from '../components/ui/HealthCards'
import { AlertCard } from '../components/ui/HealthCards'
import { ChartCard } from '../components/ui/ChartCard'
import { DigitalTwinMini } from '../components/digital-twin/DigitalTwinVisualization'
import { api, getUserName } from '../lib/api'

export function DashboardPage() {
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const name = getUserName() || 'Patient'
      setUserName(name.split(' ')[0])

      // Fetch from API parallelly
      const [medsData, alertsData, timelineData, trendsData, recordsData] = await Promise.all([
        api.getMedications(),
        api.getSafetyAlerts(),
        api.getTimeline(),
        api.getLabsTrends(),
        api.getRecords()
      ])

      const activeMedsCount = medsData.active ? medsData.active.length : 0
      const activeAlertsCount = alertsData.length
      const recentReportsCount = recordsData.length

      setStats([
        { id: 'twin', label: 'Digital Twin', value: 'Active', icon: '🧬', color: 'indigo' },
        { id: 'meds', label: 'Medications', value: `${activeMedsCount} Active`, icon: '💊', color: 'cyan' },
        { id: 'alerts', label: 'Safety Alerts', value: `${activeAlertsCount}`, icon: '⚠️', color: activeAlertsCount > 0 ? 'amber' : 'indigo' },
        { id: 'reports', label: 'Recent Reports', value: `${recentReportsCount}`, icon: '🧪', color: 'navy' },
      ])

      setAlerts(alertsData)
      setActivity(timelineData.slice(0, 4))
      setTrends(trendsData.slice(0, 3))
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading && stats.length === 0) {
    return <div className="text-center py-12 text-navy-500">Loading your Health Dashboard...</div>
  }

  return (
    <div>
      <PageHeader
        title={`Good morning, ${userName}`}
        subtitle="Here's what's happening with your health."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((card) => (
          <HealthMetricCard
            key={card.id}
            icon={card.icon}
            label={card.label}
            value={card.value}
            color={card.color as 'indigo' | 'cyan' | 'amber' | 'navy'}
          />
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-navy-900">Health Overview</h2>
          <DigitalTwinMini />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-navy-900">Priority Alerts</h2>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-navy-100 bg-white p-6 text-center text-sm text-navy-500">
                ✅ No safety alerts active.
              </div>
            ) : (
              alerts.slice(0, 2).map((alert) => (
                <AlertCard
                  key={alert.id}
                  priority={alert.priority}
                  title={alert.title}
                  description={alert.detected}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-navy-900">Recent Health Activity</h2>
        <div className="space-y-3">
          {activity.length === 0 ? (
            <div className="rounded-xl border border-dashed border-navy-100 bg-white p-6 text-center text-sm text-navy-500">
              No recent timeline activity.
            </div>
          ) : (
            activity.map((act) => (
              <div key={act.id} className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-4 card-hover">
                <span className="text-xl">{act.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-navy-900">{act.title}</p>
                  <p className="text-sm text-navy-500">{act.description}</p>
                </div>
                <span className="text-xs text-navy-400">
                  {new Date(act.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-navy-900">Health Trends</h2>
        {trends.length === 0 ? (
          <div className="rounded-xl border border-dashed border-navy-100 bg-white p-6 text-center text-sm text-navy-500">
            No lab trend data recorded.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {trends.map((trend) => (
              <ChartCard key={trend.id} {...trend} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
