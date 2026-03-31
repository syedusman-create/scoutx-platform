import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAuditLogsApi } from '../../api/admin.api'

export default function AdminAuditLogs() {
  const [q, setQ] = useState('')
  const logsQ = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => (await listAuditLogsApi({ limit: 200 })).data.data || []
  })

  const logs = logsQ.data || []
  const filtered = useMemo(() => {
    if (!q.trim()) return logs
    const s = q.trim().toLowerCase()
    return logs.filter((l) => l.action?.toLowerCase().includes(s) || l.actor_email?.toLowerCase().includes(s))
  }, [logs, q])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-display text-2xl tracking-wide">Audit Logs</div>
            <div className="text-text2 text-sm mt-1">Admin actions across critical tables.</div>
          </div>
          <input
            className="rounded-md bg-raised border border-edge px-3 py-2 text-text1"
            placeholder="Search action/actor..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-4 space-y-2">
          {filtered.map((log) => (
            <div key={log.id} className="rounded-md border border-edge p-3 bg-raised">
              <div className="text-text1 text-sm font-semibold">{log.action}</div>
              <div className="text-text2 text-xs mt-1">
                {log.actor_email || log.actor_id} • {log.table_name || ''} {log.row_pk ? `(${log.row_pk})` : ''}
                {' • '}
                {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <div className="text-text2">No logs found.</div> : null}
        </div>
      </div>
    </div>
  )
}

