import React from 'react'

const Tag = ({ children }) => {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md bg-raised border border-edge text-text1 text-xs">
      {children}
    </span>
  )
}

export default function SkillsPanel({ skills = [] }) {
  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <div className="text-display text-2xl tracking-wide">Skills</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <div className="text-text2 text-sm">Skills & endorsements (Phase 4/6).</div>
        ) : (
          skills.map((s) => <Tag key={s}>{s}</Tag>)
        )}
      </div>
    </div>
  )
}

