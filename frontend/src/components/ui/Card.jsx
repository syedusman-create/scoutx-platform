import React from 'react'

export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-lift border border-edge rounded-xl overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`px-5 py-4 border-b border-edge flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-xs font-bold tracking-widest uppercase text-text1 flex items-center gap-2 ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}
