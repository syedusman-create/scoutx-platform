import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const STAGES = ['applied', 'reviewing', 'invited', 'signed']

const StageHeader = ({ stage, count }) => {
  const label = stage.toUpperCase()
  return (
    <div className="flex items-center justify-between">
      <div className="text-display text-xl tracking-wide">{label}</div>
      <div className="text-text2 text-xs font-mono">{count}</div>
    </div>
  )
}

const Card = ({ row, onUpdateStage, onMessage }) => {
  return (
    <div className="bg-raised border border-edge rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-text1 font-semibold truncate">{row.full_name}</div>
          <div className="text-text2 text-xs truncate">
            {[row.position, row.city, row.state].filter(Boolean).join(' • ') || '—'}
          </div>
        </div>
        <div className="text-ember font-mono">{row.fitness_score ?? 0}</div>
      </div>

      {row.notes ? <div className="mt-2 text-text2 text-xs">{row.notes}</div> : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <Link
          to={`/athletes/${row.athlete_id}`}
          className="text-lime text-xs font-bold uppercase tracking-wide"
        >
          View
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.preventDefault(); onMessage?.(row.user_id) }}
            title="Message athlete"
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs bg-edge/40 border border-edge hover:bg-lift text-text2 hover:text-ice transition-all"
          >
            💬
          </button>
          <select
            value={row.stage}
            onChange={(e) => onUpdateStage(row.id, e.target.value)}
            className="rounded-md bg-surface border border-edge px-2 py-1 text-text1 text-xs outline-none focus:border-lime"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default function PipelineBoard({ rows = [], onUpdateStage }) {
  const navigate = useNavigate()
  const grouped = STAGES.reduce((acc, s) => {
    acc[s] = rows.filter((r) => r.stage === s)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
      {STAGES.map((stage) => (
        <div key={stage} className="card p-4">
          <StageHeader stage={stage} count={grouped[stage]?.length || 0} />
          <div className="mt-3 flex flex-col gap-3">
            {(grouped[stage] || []).length === 0 ? (
              <div className="text-text2 text-sm">No athletes.</div>
            ) : (
              grouped[stage].map((row) => (
                <Card key={row.id} row={row} onUpdateStage={onUpdateStage} onMessage={(uid) => navigate(`/messages?user=${uid}`)} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
