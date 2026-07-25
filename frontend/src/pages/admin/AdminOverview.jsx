import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../api/supabase.js'

const MetricCard = ({ label, value }) => (
  <div className="bg-surface border border-edge rounded-xl p-4">
    <div className="text-text2 text-xs uppercase tracking-wider">{label}</div>
    <div className="text-display text-3xl tracking-wide">{value ?? '—'}</div>
  </div>
)

export default function AdminOverview() {
  const overviewQ = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
      const { count: athletesCount } = await supabase.from('athlete_profiles').select('*', { count: 'exact', head: true })
      const { count: clubsCount } = await supabase.from('club_profiles').select('*', { count: 'exact', head: true })
      const { count: oppsCount } = await supabase.from('opportunities').select('*', { count: 'exact', head: true })
      const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      const { count: appsCount } = await supabase.from('applications').select('*', { count: 'exact', head: true })
      
      return {
        users_count: usersCount || 0,
        athletes_count: athletesCount || 0,
        clubs_count: clubsCount || 0,
        opportunities_count: oppsCount || 0,
        posts_count: postsCount || 0,
        applications_count: appsCount || 0
      }
    }
  })

  const o = overviewQ.data || {}

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Users" value={o.users_count} />
        <MetricCard label="Athletes" value={o.athletes_count} />
        <MetricCard label="Clubs" value={o.clubs_count} />
        <MetricCard label="Opportunities" value={o.opportunities_count} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Posts" value={o.posts_count} />
        <MetricCard label="Applications" value={o.applications_count} />
        <MetricCard label="—" value={null} />
        <MetricCard label="—" value={null} />
      </div>
    </div>
  )
}

