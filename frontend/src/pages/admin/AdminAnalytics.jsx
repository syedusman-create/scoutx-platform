import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminOverviewApi, listAuditLogsApi } from '../../api/admin.api'

const BarRow = ({ label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-44 text-text2 text-xs truncate">{label}</div>
    <div className="flex-1 h-2 rounded bg-edge overflow-hidden">
      <div className="h-2 rounded bg-lime" style={{ width: `${value}%` }} />
    </div>
    <div className="w-10 text-right text-text1 text-xs font-mono">{value}</div>
  </div>
)

export default function AdminAnalytics() {
  const overviewQ = useQuery({
    queryKey: ['admin-overview-for-analytics'],
    queryFn: async () => (await getAdminOverviewApi()).data.data
  })
  const auditsQ = useQuery({
    queryKey: ['admin-audit-logs-analytics'],
    queryFn: async () => (await listAuditLogsApi({ limit: 500 })).data.data || []
  })

  const topActions = useMemo(() => {
    const audits = auditsQ.data || []
    const map = {}
    for (const a of audits) {
      if (!a.action) continue
      map[a.action] = (map[a.action] || 0) + 1
    }
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8)
    const max = sorted[0]?.[1] || 1
    return sorted.map(([action, count]) => ({ action, pct: Math.round((count / max) * 100) }))
  }, [auditsQ.data])

  const o = overviewQ.data || {}

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="text-display text-2xl tracking-wide">Admin Analytics</div>
        <div className="text-text2 text-sm mt-1">Quick view based on audit logs and overview metrics.</div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-raised/50 border border-edge rounded-xl p-4">
            <div className="text-text2 text-xs uppercase tracking-wider">Users</div>
            <div className="text-display text-3xl tracking-wide">{o.users_count ?? '—'}</div>
          </div>
          <div className="bg-raised/50 border border-edge rounded-xl p-4">
            <div className="text-text2 text-xs uppercase tracking-wider">Athletes</div>
            <div className="text-display text-3xl tracking-wide">{o.athletes_count ?? '—'}</div>
          </div>
          <div className="bg-raised/50 border border-edge rounded-xl p-4">
            <div className="text-text2 text-xs uppercase tracking-wider">Clubs</div>
            <div className="text-display text-3xl tracking-wide">{o.clubs_count ?? '—'}</div>
          </div>
          <div className="bg-raised/50 border border-edge rounded-xl p-4">
            <div className="text-text2 text-xs uppercase tracking-wider">Posts</div>
            <div className="text-display text-3xl tracking-wide">{o.posts_count ?? '—'}</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-display text-xl tracking-wide">Top Admin Actions</div>
          <div className="text-text2 text-xs">{auditsQ.data ? `Based on ${auditsQ.data.length} logs` : ''}</div>
        </div>

        <div className="mt-3 space-y-2">
          {topActions.length === 0 ? <div className="text-text2">No audit data yet.</div> : null}
          {topActions.map((a) => (
            <BarRow key={a.action} label={a.action} value={a.pct} />
          ))}
        </div>
      </div>
    </div>
  )
}

