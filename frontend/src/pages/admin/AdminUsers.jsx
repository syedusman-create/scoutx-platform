import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../api/supabase.js'

export default function AdminUsers() {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')

  const usersQ = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: true
  })

  const users = usersQ.data || []
  const filtered = useMemo(() => {
    if (!query.trim()) return users
    const q = query.trim().toLowerCase()
    return users.filter((u) => u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q))
  }, [query, users])

  const roleM = useMutation({
    mutationFn: async ({ userId, role }) => {
      const { data, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-display text-2xl tracking-wide">User Management</div>
            <div className="text-text2 text-sm mt-1">Update roles and verification status.</div>
          </div>
          <input
            className="rounded-md bg-raised border border-edge px-3 py-2 text-text1"
            placeholder="Search email/role..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-text2">No users found.</div>
          ) : null}
          {filtered.map((u) => (
            <div key={u.id} className="rounded-md border border-edge p-3 bg-raised flex flex-wrap gap-3 items-center justify-between">
              <div>
                <div className="text-text1 text-sm font-semibold">{u.email}</div>
                <div className="text-text2 text-xs">Role: {u.role} • Verified: {u.is_verified ? 'Yes' : 'No'}</div>
              </div>
              <select
                defaultValue={u.role}
                onChange={(e) => roleM.mutate({ userId: u.id, role: e.target.value })}
                className="rounded-md bg-surface border border-edge px-3 py-2 text-sm text-text1"
                disabled={roleM.isPending}
              >
                <option value="athlete">athlete</option>
                <option value="club">club</option>
                <option value="scout">scout</option>
                <option value="admin">admin</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

