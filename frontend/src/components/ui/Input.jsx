import React from 'react'

export default function Input({ label, type = 'text', error, className = '', ...props }) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-bold uppercase tracking-wider text-text3">{label}</label>}
      <input
        type={type}
        className={`w-full bg-lift border border-edge rounded-lg px-4 py-2.5 text-sm text-text1 placeholder-text3 focus:outline-none focus:border-lime transition-colors duration-150 ${error ? 'border-ember' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-ember font-medium">{error}</span>}
    </div>
  )
}
