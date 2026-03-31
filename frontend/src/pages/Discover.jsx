import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import SearchFilters from '../components/club/SearchFilters.jsx'
import { discoverAthletesApi, upsertShortlistApi } from '../api/club.api'

const initialFilters = {
  sport: 'football',
  position: '',
  state: '',
  minFitness: '',
  minAge: '',
  maxAge: '',
  isOpen: false,
  sortBy: 'fitness_desc',
  page: 1,
  limit: 20
}

// ── Skeleton ──────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-lift border border-edge rounded-xl p-4 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-edge flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3.5 bg-edge rounded w-2/3" />
          <div className="h-2.5 bg-edge rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-edge rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────
const avatarColors = [
  'bg-lime/20 text-lime', 'bg-ember/20 text-ember',
  'bg-ice/20 text-ice', 'bg-violet-400/20 text-violet-400', 'bg-pink-400/20 text-pink-400'
]
function Avatar({ email, name }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (email?.split('@')[0] || '?').slice(0, 2).toUpperCase()
  const color = avatarColors[(email?.charCodeAt(0) || 0) % avatarColors.length]
  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

// ── Athlete card ──────────────────────────────────────────────
function AthleteCard({ athlete, onShortlist, isShortlisting }) {
  const [shortlisted, setShortlisted] = useState(false)
  const displayName = athlete.full_name || athlete.email?.split('@')[0] || 'Athlete'

  const handleShortlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShortlisted(v => !v)
    onShortlist?.(athlete.id)
  }

  return (
    <Link
      to={`/athletes/${athlete.id}`}
      className="block bg-lift border border-edge rounded-xl overflow-hidden hover:border-line hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* Card header — subtle gradient bg */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-b from-edge/20 to-transparent border-b border-edge">
        <div className="flex items-start gap-3">
          <Avatar email={athlete.email} name={athlete.full_name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-text1 font-semibold text-sm truncate group-hover:text-lime transition-colors">
                {displayName}
              </span>
              {athlete.age_verified && (
                <span className="text-lime text-[10px] font-bold flex-shrink-0" title="Age verified">✓</span>
              )}
            </div>
            <div className="text-text2 text-xs mt-0.5 truncate">{athlete.position || 'Football Player'}</div>
            <div className="text-text3 text-xs mt-0.5 truncate">
              {[athlete.city, athlete.state].filter(Boolean).join(', ') || 'India'}
            </div>
          </div>
          {/* Availability badge */}
          {athlete.is_open && (
            <div className="flex-shrink-0 flex items-center gap-1 bg-lime/10 border border-lime/20 px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-lime animate-pulse inline-block" />
              <span className="text-lime text-[9px] font-bold uppercase tracking-wide">Open</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-edge border-b border-edge">
        {[
          { label: 'Matches', value: athlete.total_matches ?? '—' },
          { label: 'Goals', value: athlete.total_goals ?? '—' },
          { label: 'Assists', value: athlete.total_assists ?? '—' },
        ].map(s => (
          <div key={s.label} className="px-2 py-2.5 text-center">
            <div className="text-text1 font-bold text-base leading-none" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              {s.value}
            </div>
            <div className="text-text3 text-[9px] uppercase tracking-wide mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center gap-2">
        {/* Fitness score */}
        {athlete.fitness_score > 0 && (
          <div className="flex items-center gap-1.5 bg-ember/10 border border-ember/20 px-2 py-1 rounded-md">
            <span className="text-ember text-xs font-bold">⚡</span>
            <span className="text-ember text-xs font-bold">{athlete.fitness_score}</span>
          </div>
        )}
        {/* Video clips badge */}
        {athlete.has_highlights && (
          <div className="flex items-center gap-1 bg-lift border border-edge px-2 py-1 rounded-md">
            <span className="text-text3 text-[10px]">🎬 Clips</span>
          </div>
        )}

        {/* Actions */}
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={handleShortlist}
            disabled={isShortlisting}
            title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
            className={[
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all',
              shortlisted
                ? 'bg-lime/20 border border-lime/30 text-lime'
                : 'bg-edge/50 border border-edge hover:bg-lift text-text3 hover:text-amber-400'
            ].join(' ')}
          >
            ⭐
          </button>
          <div
            role="button"
            onClick={e => { e.preventDefault(); window.location.href = `/messages?user=${athlete.user_id}` }}
            title="Message athlete"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-edge/50 border border-edge hover:bg-lift text-text3 hover:text-ice transition-all"
          >
            💬
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Empty state ───────────────────────────────────────────────
function EmptyResults({ hasFilters }) {
  return (
    <div className="col-span-3 py-16 text-center">
      <div className="text-4xl mb-4">🔭</div>
      <div className="text-text1 font-semibold text-lg">No athletes found</div>
      <div className="text-text2 text-sm mt-2">
        {hasFilters
          ? 'Try removing some filters to see more results.'
          : 'No athletes are registered yet. Check back soon!'}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Discover() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)

  const queryParams = useMemo(() => {
    const p = { sport: filters.sport, sortBy: filters.sortBy, page: filters.page, limit: filters.limit }
    if (filters.position) p.position = filters.position
    if (filters.state) p.state = filters.state
    if (filters.minFitness !== '') p.minFitness = Number(filters.minFitness)
    if (filters.minAge !== '') p.minAge = Number(filters.minAge)
    if (filters.maxAge !== '') p.maxAge = Number(filters.maxAge)
    if (filters.isOpen) p.isOpen = true
    return p
  }, [filters])

  const discoverQ = useQuery({
    queryKey: ['discover-athletes', queryParams],
    queryFn: async () => {
      const res = await discoverAthletesApi(queryParams)
      return {
        athletes: res.data.data || [],
        pagination: res.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 }
      }
    },
    keepPreviousData: true
  })

  const shortlistM = useMutation({
    mutationFn: ({ athleteId }) => upsertShortlistApi({ athleteId, stage: 'applied', notes: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-shortlists'] })
  })

  const athletes = discoverQ.data?.athletes || []
  const pagination = discoverQ.data?.pagination || {}
  const hasFilters = !!(filters.position || filters.state || filters.minFitness || filters.isOpen)

  return (
    <div className="flex flex-col gap-4">

      {/* Filters */}
      <SearchFilters
        filters={filters}
        onChange={(key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }))}
        onReset={() => setFilters(initialFilters)}
      />

      {/* Results header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-text1 font-bold text-lg" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
            Discover Athletes
          </div>
          {!discoverQ.isLoading && (
            <div className="bg-lift border border-edge px-2.5 py-1 rounded-full">
              <span className="text-text2 text-xs font-mono">{pagination.total ?? 0} results</span>
            </div>
          )}
          {discoverQ.isFetching && !discoverQ.isLoading && (
            <div className="text-text3 text-xs">Updating…</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy}
            onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value, page: 1 }))}
            className="bg-lift border border-edge rounded-lg px-3 py-1.5 text-text2 text-xs outline-none focus:border-lime/50"
          >
            <option value="fitness_desc">Fitness ↓</option>
            <option value="matches_desc">Most Matches</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {discoverQ.isLoading ? (
          [...Array(6)].map((_, i) => <CardSkeleton key={i} />)
        ) : discoverQ.isError ? (
          <div className="col-span-3 bg-ruby/10 border border-ruby/20 text-ruby text-sm px-4 py-3 rounded-xl">
            Failed to load athletes. <button onClick={() => discoverQ.refetch()} className="underline">Retry</button>
          </div>
        ) : athletes.length === 0 ? (
          <EmptyResults hasFilters={hasFilters} />
        ) : (
          athletes.map(athlete => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              onShortlist={(athleteId) => shortlistM.mutate({ athleteId })}
              isShortlisting={shortlistM.isPending}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            className="btn-secondary text-xs px-4 py-2"
          >
            ← Prev
          </button>
          <span className="text-text2 text-xs font-mono px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            className="btn-primary text-xs px-4 py-2"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}