import React from 'react'

export default function Tag({ children, variant = 'lime', className = '', ...props }) {
  const variants = {
    lime: 'bg-lime/10 text-lime border border-lime/20',
    ember: 'bg-ember/10 text-ember border border-ember/20',
    ice: 'bg-ice/10 text-ice border border-ice/20',
    muted: 'bg-white/[0.03] text-text3 border border-edge'
  }
  
  return (
    <span
      className={`text-[11px] font-bold tracking-wide px-2.5 py-0.5 rounded-sm inline-flex items-center gap-1 ${variants[variant] || variants.muted} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
