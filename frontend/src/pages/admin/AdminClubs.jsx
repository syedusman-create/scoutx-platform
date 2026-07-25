import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../api/supabase.js'

export default function AdminClubs() {
  const [query, setQuery] = useState('')

  const clubsQ = useQuery({
    queryKey: ['admin-clubs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_profiles')
        .select(`
          id,
          club_name,
          league,
          city,
          state,
          founded_year,
          users:user_id (email)
        `)
      if (error) throw error
      return (data || []).map(c => ({
        ...c,
        email: c.users?.email || 'No email'
      }))
    }
  })

  const clubs = clubsQ.data || []
  const filtered = useMemo(() => {
    if (!query.trim()) return clubs
    const q = query.trim().toLowerCase()
    return clubs.filter(c =>
      c.club_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.league?.toLowerCase().includes(q)
    )
  }, [query, clubs])

  return (
    <div className="bg-surface border border-edge rounded-xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <div className="text-display text-2xl tracking-wide">Clubs Database</div>
          <div className="text-text2 text-sm mt-1">List of all registered clubs and their details.</div>
        </div>
        <input
          className="rounded-md bg-raised border border-edge px-3 py-2 text-text1 text-sm outline-none focus:border-lime"
          placeholder="Search club/email/league..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {clubsQ.isLoading ? (
        <div className="text-text2 py-4">Loading clubs...</div>
      ) : clubsQ.isError ? (
        <div className="text-ember py-4">Error loading clubs: {clubsQ.error.message}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-edge text-text3 font-semibold uppercase tracking-wider">
                <th className="py-2">Club Name</th>
                <th className="py-2">Contact Email</th>
                <th className="py-2">League</th>
                <th className="py-2">Location</th>
                <th className="py-2">Founded</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-edge/30 text-text1 hover:bg-raised/40 transition-colors">
                  <td className="py-3 font-semibold">{c.club_name}</td>
                  <td className="py-3 text-lime">{c.email}</td>
                  <td className="py-3 text-text2 uppercase">{c.league || '—'}</td>
                  <td className="py-3 text-text2">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="py-3 text-text2 font-mono">{c.founded_year || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
