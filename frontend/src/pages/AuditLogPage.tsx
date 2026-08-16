import { useState, useEffect } from 'react'
import { PageHeader, Card } from '../components/ui/primitives'
import { api } from '../lib/api'

export function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadAuditLog = async () => {
    setLoading(true)
    try {
      const data = await api.getAccessLog()
      setLogs(data)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuditLog()
  }, [])

  if (loading && logs.length === 0) {
    return <div className="text-center py-12 text-navy-500">Loading audit trail...</div>
  }

  return (
    <div>
      <PageHeader
        title="📜 Data Access History"
        subtitle="A complete record of who accessed your health data and when."
      />

      <Card>
        <div className="space-y-0">
          {logs.length === 0 ? (
            <div className="text-center py-6 text-sm text-navy-500">No accesses logged.</div>
          ) : (
            logs.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between ${
                  i < logs.length - 1 ? 'border-b border-navy-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-bold text-navy-600">
                    {entry.actor.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-navy-900">{entry.actor}</p>
                    <p className="text-sm text-navy-600">{entry.action}</p>
                    <p className="text-xs text-navy-400">Data: {entry.dataAccessed}</p>
                  </div>
                </div>
                <time className="shrink-0 text-xs text-navy-400">
                  {new Date(entry.timestamp).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
