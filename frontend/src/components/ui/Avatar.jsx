import React from 'react'

export default function Avatar({ src, alt = 'Avatar', size = 'md', className = '', ...props }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  }
  
  const initials = alt ? alt.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?'

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center bg-edge text-text2 font-bold flex-shrink-0 select-none border border-edge ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
