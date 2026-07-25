import React from 'react'

const Pill = ({ label, value, unit }) => {
  return (
    <div className="bg-raised border border-edge rounded-xl p-3">
      <div className="text-text2 text-[11px] uppercase tracking-wide">{label}</div>
      <div className="mt-1 font-mono text-text1">
        {value}
        {unit ? <span className="text-text2 ml-1">{unit}</span> : null}
      </div>
    </div>
  )
}

export default function FitnessPanel({ fitnessScore = 0, tests = [] }) {
  const top = tests.slice(0, 6)

  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-display text-2xl tracking-wide">Fitness</div>
        <div className="text-ember font-mono text-xl">{fitnessScore}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {top.length === 0 ? (
          <div className="col-span-2 md:col-span-3 text-text2 text-sm">No fitness tests yet.</div>
        ) : (
          top.map((t) => (
            <Pill key={t.id} label={t.test_type} value={t.score} unit={t.unit} />
          ))
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-edge bg-background px-3 py-2 text-xs text-text2">
          Fitness tests here feed the profile and leaderboard calculations.
        </div>
        <div className="rounded-xl border border-edge bg-background px-3 py-2 text-xs text-text2">
          Compare athletes on the leaderboards page.
        </div>
      </div>
    </div>
  )
}
