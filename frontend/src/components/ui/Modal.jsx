import React from 'react'
import { X } from 'lucide-react'
import Button from './Button.jsx'

export default function Modal({ isOpen, onClose, title, children, className = '', ...props }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Card */}
      <div
        className={`relative bg-lift border border-edge rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col z-10 ${className}`}
        {...props}
      >
        <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
          {title && <h3 className="text-sm font-bold tracking-widest uppercase text-text1">{title}</h3>}
          <Button variant="ghost" onClick={onClose} className="p-1.5 rounded-full border-0 !bg-transparent hover:!text-lime">
            <X size={18} />
          </Button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1 text-sm text-text2">
          {children}
        </div>
      </div>
    </div>
  )
}
