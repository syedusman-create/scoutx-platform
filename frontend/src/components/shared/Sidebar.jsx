import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Briefcase, ChevronLeft, Compass, LayoutDashboard, MessageSquare, ShieldCheck, UserCircle, Newspaper } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const NavLink = ({ to, label, active, showDot, icon, collapsed, onNavigate }) => {
  const Icon = icon
  return (
    <Link
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={[
        'flex items-center gap-2 px-3 py-2 rounded-md border border-edge bg-raised/0 hover:bg-raised/50 transition-colors',
        active ? 'bg-raised/60' : 'bg-surface'
      ].join(' ')}
    >
      {Icon ? <Icon size={16} className="text-text2 shrink-0" /> : null}
      {showDot ? (
        <span
          className={[
            'relative w-2 h-2 rounded-full',
            active ? 'bg-lime' : 'bg-lime/60'
          ].join(' ')}
        >
          {active ? <span className="absolute inset-0 rounded-full bg-lime opacity-60 animate-ping" /> : null}
        </span>
      ) : null}
      {collapsed ? null : <span className="font-body text-text1 text-sm">{label}</span>}
    </Link>
  )
}

export default function Sidebar({ collapsed = false, onToggleCollapse, onNavigate }) {
  const { user } = useAuth()
  const location = useLocation()
  const role = user?.role

  const isActive = (path) => location.pathname === path
  const showOpenDot = location.pathname === '/opportunities'

  return (
    <div className="flex h-full flex-col gap-3 p-2">
      <div className="px-1 py-2">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/scoutx-logo.png" alt="ScoutX" className="h-8 w-8 object-contain shrink-0" />
            {collapsed ? null : (
              <div className="min-w-0">
                <div className="text-display tracking-wide text-text1 text-2xl font-semibold truncate">ScoutX</div>
                <div className="text-text2 text-xs mt-1">{role ? `${role.toUpperCase()}` : 'GUEST'}</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-md border border-edge bg-surface hover:bg-raised text-text2"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft size={16} className={collapsed ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {role === 'admin' ? (
          <NavLink to="/admin/erp/overview" label="Admin ERP" icon={ShieldCheck} collapsed={collapsed} active={location.pathname.startsWith('/admin/erp')} onNavigate={onNavigate} />
        ) : (
          <>
            <NavLink to="/feed" label="Feed" icon={Newspaper} collapsed={collapsed} active={isActive('/feed')} onNavigate={onNavigate} />

            <NavLink
              to="/opportunities"
              label="Open to Opportunities"
              icon={Briefcase}
              collapsed={collapsed}
              active={location.pathname.startsWith('/opportunities')}
              showDot={true}
              onNavigate={onNavigate}
            />

            {role === 'club' ? (
              <NavLink to="/club/dashboard" label="Club Dashboard" icon={LayoutDashboard} collapsed={collapsed} active={isActive('/club/dashboard')} onNavigate={onNavigate} />
            ) : null}

            {role === 'club' || role === 'scout' ? (
              <NavLink to="/discover" label="Discover" icon={Compass} collapsed={collapsed} active={isActive('/discover')} onNavigate={onNavigate} />
            ) : null}

            <NavLink to="/messages" label="Messages" icon={MessageSquare} collapsed={collapsed} active={isActive('/messages')} onNavigate={onNavigate} />
            {(role === 'athlete' || role === 'club') ? (
              <NavLink to="/profile" label="My Profile" icon={UserCircle} collapsed={collapsed} active={isActive('/profile')} onNavigate={onNavigate} />
            ) : null}
            <NavLink to="/analytics" label="Analytics" icon={BarChart3} collapsed={collapsed} active={isActive('/analytics')} onNavigate={onNavigate} />
          </>
        )}
      </nav>
    </div>
  )
}

