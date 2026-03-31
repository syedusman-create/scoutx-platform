import React from 'react'
import { Link } from 'react-router-dom'

export default function AthleteCard({ athlete }) {
  if (!athlete) return null

  const open = Boolean(athlete.is_open)
  const verified = Boolean(athlete.user_is_verified)

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-text1 font-semibold text-lg">{athlete.full_name}</div>
          <div className="text-text2 text-sm">
            {[athlete.position, athlete.city, athlete.state].filter(Boolean).join(' • ')}
          </div>
        </div>
        <div className="text-ember font-mono text-lg">{athlete.fitness_score ?? 0}</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {verified ? (
          <span className="status-pill bg-raised text-lime">
            <span className="h-2 w-2 rounded-full bg-lime" />
            Verified
          </span>
        ) : null}

        <span className="status-pill bg-raised text-text2">
          <span className={`h-2 w-2 rounded-full ${open ? 'bg-lime' : 'bg-text3'}`} />
          {open ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-text2 text-xs font-mono">
          M {athlete.total_matches ?? 0} • G {athlete.total_goals ?? 0} • A {athlete.total_assists ?? 0}
        </div>
        <Link
          to={`/athletes/${athlete.id}`}
          className="btn-primary text-xs"
        >
          View Profile
        </Link>
      </div>
    </div>
  )
}

