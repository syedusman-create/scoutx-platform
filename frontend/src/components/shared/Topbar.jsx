import React from 'react'
import { PanelLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Topbar({ onOpenSidebar }) {
  const { user } = useAuth()
  const role = user?.role
  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-edge bg-surface">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden h-8 w-8 inline-flex items-center justify-center rounded-md border border-edge bg-background text-text2"
          aria-label="Open sidebar"
        >
          <PanelLeft size={16} />
        </button>
        <img src="/scoutx-logo.png" alt="ScoutX" className="h-8 w-8 rounded-md object-contain border border-edge" />
        <div>
          <div className="text-display font-semibold text-text1 text-xl">ScoutX</div>
          <div className="text-text2 text-xs">{role ? `${role.toUpperCase()} PORTAL` : 'GUEST'}</div>
        </div>
      </div>
      <div className="text-text2 text-sm hidden md:block">
        {/* TODO: add notifications badge */}
      </div>
    </div>
  )
}

