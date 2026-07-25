import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Rss, Briefcase, MessageSquare, Trophy, User, ShieldAlert, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function DashboardNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const role = user?.role
  const isAdmin = role === 'admin'

  const navItems = [
    { to: '/feed', label: 'Feed', icon: <Rss size={18} /> },
    { to: '/opportunities', label: 'Opportunities', icon: <Briefcase size={18} /> },
    { to: '/messages', label: 'Messages', icon: <MessageSquare size={18} /> },
    { to: '/leaderboards', label: 'Leaderboards', icon: <Trophy size={18} /> },
    { to: '/profile', label: 'My Profile', icon: <User size={18} /> }
  ]

  if (isAdmin) {
    navItems.push({ to: '/admin/erp', label: 'Admin ERP', icon: <ShieldAlert size={18} /> })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      {/* Desktop Floating Pill Nav Bar (Top Center) — icons only with hover tooltips */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 hidden md:block">
        <div className="glass-card rounded-full px-5 py-2.5 flex items-center justify-between border border-white/10 shadow-2xl backdrop-blur-md glow-lime">
          
          {/* Logo */}
          {/* Logo: navigate to club dashboard for club users, otherwise to feed */}
          <Link
            to={role === 'club' ? '/club/dashboard' : '/feed'}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <img src="/scoutx-logo.png" alt="ScoutX logo" className="h-9 w-9 object-contain" />
            <span className="font-semibold tracking-[0.15em] text-white text-sm">SCOUTX</span>
          </Link>

          {/* Icon-only links with tooltip on hover */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.to} className="relative group">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `h-9 w-9 rounded-full transition-all duration-200 flex items-center justify-center ${
                      isActive
                        ? 'bg-lime text-background shadow-[0_0_15px_-3px_rgba(198,241,53,0.4)]'
                        : 'text-text3 hover:text-white hover:bg-white/8'
                    }`
                  }
                  aria-label={item.label}
                >
                  {item.icon}
                </NavLink>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                  <div className="bg-raised border border-edge rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text1 whitespace-nowrap shadow-xl">
                    {item.label}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-raised border-l border-t border-edge rotate-45" />
                  </div>
                </div>
              </div>
            ))}
          </nav>

          {/* User Avatar + Dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="h-9 w-9 rounded-full bg-raised border border-edge flex items-center justify-center font-bold text-xs text-lime cursor-pointer hover:border-lime/50 transition-colors"
            >
              {user?.email?.slice(0, 2).toUpperCase() || 'U'}
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-raised border border-edge rounded-2xl p-2 shadow-2xl z-50 animate-fade-up">
                <div className="px-3 py-2 text-xs text-text3 border-b border-edge/30 pb-2 mb-1 truncate">
                  {user?.email}
                </div>
                <div className="px-3 py-1.5 text-[10px] text-text3 uppercase tracking-wider font-bold">
                  Role: {role}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase text-ember hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer mt-1"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Bottom Dock — icons only */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md md:hidden">
        <div className="glass-card rounded-full px-6 py-3 flex items-center justify-around border border-white/10 shadow-2xl backdrop-blur-md glow-lime">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) =>
                `h-10 w-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-lime text-background scale-110 shadow-[0_0_15px_-3px_rgba(198,241,53,0.4)]'
                    : 'text-text3'
                }`
              }
            >
              {item.icon}
            </NavLink>
          ))}
          
          {/* Mobile Logout */}
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="h-10 w-10 flex items-center justify-center rounded-full text-ember hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
