import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui/primitives'
import { TimelineItem } from '../components/ui/ContentCards'
import { Drawer } from '../components/ui/Overlays'
import { StatusBadge } from '../components/ui/primitives'
import { api } from '../lib/api'

export function MedicalTimelinePage() {
  const [events, setEvents] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTimeline = async () => {
    setLoading(true)
    try {
      const data = await api.getTimeline()
      setEvents(data)
    } catch (err) {
      console.error('Failed to load timeline events:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTimeline()
  }, [])

  const grouped = events.reduce<Record<number, any[]>>((acc, event) => {
    if (!acc[event.year]) acc[event.year] = []
    acc[event.year].push(event)
    return acc
  }, {})

  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a)

  if (loading && events.length === 0) {
    return <div className="text-center py-12 text-navy-500">Loading your health journey timeline...</div>
  }

  return (
    <div>
      <PageHeader
        title="Medical Timeline"
        subtitle="Your complete health journey, chronologically organized."
      />

      <div className="mx-auto max-w-2xl">
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-navy-100 bg-white p-6 text-center text-sm text-navy-500">
            No events in medical timeline.
          </div>
        ) : (
          years.map((year) => (
            <div key={year} className="mb-8">
              <h2 className="mb-6 text-2xl font-bold text-navy-900">{year}</h2>
              {grouped[year].map((event, i) => (
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
                  isLast={i === grouped[year].length - 1}
                  onClick={() => setSelected(event)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selected.icon}</span>
              <div>
                <p className="text-sm text-navy-500">
                  {new Date(selected.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <StatusBadge status={selected.status} />
              </div>
            </div>
            <p className="text-navy-700">{selected.description}</p>
            <div className="rounded-lg bg-navy-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-navy-400">Source</p>
              <p className="mt-1 text-sm font-medium text-navy-800">{selected.source}</p>
            </div>
            <div className="rounded-lg bg-navy-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-navy-400">Type</p>
              <p className="mt-1 text-sm font-medium capitalize text-navy-800">{selected.type}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
