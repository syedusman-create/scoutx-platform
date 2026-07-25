import React from 'react'

const Tag = ({ children }) => {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-raised border border-edge text-lime font-semibold text-xs tracking-wide shadow-sm">
      ⚡ {children}
    </span>
  )
}

export default function StrengthsPanel({ strengths = [] }) {
  return (
    <div className="bg-lift border border-edge rounded-xl p-5">
      <div className="text-text3 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-lime inline-block" />
        Key Strengths
      </div>
      <div className="flex flex-wrap gap-2">
        {strengths.length === 0 ? (
          <div className="text-text2 text-xs italic">No strengths listed yet.</div>
        ) : (
          strengths.map((s) => <Tag key={s}>{s}</Tag>)
        )}
      </div>
    </div>
  )
}


