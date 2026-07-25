import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../api/supabase.js'

export default function AdminAthletes() {
  const [query, setQuery] = useState('')

  const athletesQ = useQuery({
    queryKey: ['admin-athletes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select(`
          id,
          full_name,
          sport,
          position,
          city,
          state,
          fitness_score,
          users:user_id (email)
        `)
      if (error) throw error
      return (data || []).map(a => ({
        ...a,
        email: a.users?.email || 'No email'
      }))
    }
  })

  const athletes = athletesQ.data || []
  const filtered = useMemo(() => {
    if (!query.trim()) return athletes
    const q = query.trim().toLowerCase()
    return athletes.filter(a =>
      a.full_name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.position?.toLowerCase().includes(q)
    )
  }, [query, athletes])

  return (
    <div className="bg-surface border border-edge rounded-xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <div className="text-display text-2xl tracking-wide">Athletes Database</div>
          <div className="text-text2 text-sm mt-1">List of all registered athletes and their details.</div>
        </div>
        <input
          className="rounded-md bg-raised border border-edge px-3 py-2 text-text1 text-sm outline-none focus:border-lime"
          placeholder="Search name/email/position..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {athletesQ.isLoading ? (
        <div className="text-text2 py-4">Loading athletes...</div>
      ) : athletesQ.isError ? (
        <div className="text-ember py-4">Error loading athletes: {athletesQ.error.message}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-edge text-text3 font-semibold uppercase tracking-wider">
                <th className="py-2">Full Name</th>
                <th className="py-2">Contact Email</th>
                <th className="py-2">Position</th>
                <th className="py-2">Location</th>
                <th className="py-2">Fitness</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b border-edge/30 text-text1 hover:bg-raised/40 transition-colors">
                  <td className="py-3 font-semibold">{a.full_name}</td>
                  <td className="py-3 text-lime">{a.email}</td>
                  <td className="py-3 text-text2 capitalize">{a.position || '—'}</td>
                  <td className="py-3 text-text2">{[a.city, a.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="py-3 font-mono font-bold text-ember">{a.fitness_score ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
