import React from 'react'

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyle = 'inline-flex items-center justify-center font-bold px-5 py-2.5 rounded-md text-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-lime text-background uppercase tracking-wide hover:brightness-110 hover:-translate-y-px border-0',
    ghost: 'bg-transparent text-text2 border border-edge hover:border-mist hover:text-text1',
    ember: 'bg-ember text-background uppercase tracking-wide hover:brightness-110 hover:-translate-y-px border-0',
    danger: 'bg-red-500 text-white hover:bg-red-600 border-0'
  }
  
  return (
    <button
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
