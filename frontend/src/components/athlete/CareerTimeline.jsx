import React from 'react'

const Row = ({ left, right }) => {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-edge last:border-b-0">
      <div className="min-w-0">
        <div className="text-text1 font-semibold truncate">{left}</div>
        {right?.sub ? <div className="text-text2 text-sm">{right.sub}</div> : null}
      </div>
      {right?.meta ? <div className="text-text2 text-sm font-mono whitespace-nowrap">{right.meta}</div> : null}
    </div>
  )
}

export default function CareerTimeline({ entries = [] }) {
  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-display text-2xl tracking-wide">Career</div>
        <div className="text-text2 text-xs font-mono">{entries.length} entries</div>
      </div>

      <div className="mt-4">
        {entries.length === 0 ? (
          <div className="text-text2 text-sm">No career entries yet.</div>
        ) : (
          entries.map((e) => {
            const start = e.start_date ? new Date(e.start_date).getFullYear() : ''
            const end = e.end_date ? new Date(e.end_date).getFullYear() : e.is_current ? 'Present' : ''
            const years = start ? `${start}${end ? `–${end}` : ''}` : ''
            const meta = [
              typeof e.matches === 'number' ? `${e.matches}M` : null,
              typeof e.goals === 'number' ? `${e.goals}G` : null,
              typeof e.assists === 'number' ? `${e.assists}A` : null
            ]
              .filter(Boolean)
              .join(' • ')

            return (
              <Row
                key={e.id}
                left={`${e.club_name}${e.role ? ` — ${e.role}` : ''}`}
                right={{
                  sub: [e.competition, years].filter(Boolean).join(' • '),
                  meta
                }}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

