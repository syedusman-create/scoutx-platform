import React from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'

import Sidebar     from './components/shared/Sidebar.jsx'
import Topbar      from './components/shared/Topbar.jsx'
import ProtectedRoute from './components/shared/ProtectedRoute.jsx'

import Landing       from './pages/Landing.jsx'
import Login         from './pages/Login.jsx'
import Signup        from './pages/Signup.jsx'
import Feed          from './pages/Feed.jsx'
import AthleteProfile from './pages/AthleteProfile.jsx'
import ClubProfile    from './pages/ClubProfile.jsx'
import ClubDashboard  from './pages/ClubDashboard.jsx'
import Discover       from './pages/Discover.jsx'
import Opportunities  from './pages/Opportunities.jsx'
import Messages       from './pages/Messages.jsx'
import Analytics      from './pages/Analytics.jsx'
import Profile        from './pages/Profile.jsx'
import AdminERP       from './pages/AdminERP.jsx'
import Startup        from './pages/Startup.jsx'
import StartupGate    from './components/onboarding/StartupGate.jsx'
import AdminOverview  from './pages/admin/AdminOverview.jsx'
import AdminUsers     from './pages/admin/AdminUsers.jsx'
import AdminVerification from './pages/admin/AdminVerification.jsx'
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx'
import AdminSocialPosting from './pages/admin/AdminSocialPosting.jsx'
import AdminIntegrations from './pages/admin/AdminIntegrations.jsx'
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx'
import { useAuth } from './context/AuthContext.jsx'

const ShellLayout = () => {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  return (
    <div className="min-h-screen bg-background text-text1 flex font-body">
      {/* Sidebar desktop */}
      <aside className={[ 'flex-shrink-0 border-r border-edge bg-surface hidden lg:flex flex-col transition-all duration-200', collapsed ? 'w-[84px]' : 'w-60' ].join(' ')}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      </aside>

      {/* Sidebar mobile drawer */}
      {mobileOpen ? (
        <div className="lg:hidden fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-label="Close sidebar" />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-edge bg-surface">
            <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

const RoleDefaultRedirect = () => {
  const { user } = useAuth()
  const to = user?.role === 'admin' ? '/admin/erp/overview' : '/feed'
  return <Navigate to={to} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<Landing />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Authenticated shell */}
        <Route element={<ShellLayout />}>

          {/* All authenticated roles */}
          <Route element={<ProtectedRoute allowedRoles={['athlete','club','scout']} />}>
            <Route path="/startup"       element={<StartupGate><Startup /></StartupGate>} />
            <Route path="/feed"           element={<StartupGate><Feed /></StartupGate>} />
            <Route path="/messages"       element={<StartupGate><Messages /></StartupGate>} />
            <Route path="/opportunities"  element={<StartupGate><Opportunities /></StartupGate>} />
            <Route path="/athletes/:id"   element={<StartupGate><AthleteProfile /></StartupGate>} />
            <Route path="/clubs/:id"      element={<StartupGate><ClubProfile /></StartupGate>} />
            <Route path="/profile"        element={<StartupGate><Profile /></StartupGate>} />
          </Route>

          {/* Athlete + Club */}
          <Route element={<ProtectedRoute allowedRoles={['athlete','club']} />}>
            <Route path="/analytics" element={<StartupGate><Analytics /></StartupGate>} />
          </Route>

          {/* Club + Scout */}
          <Route element={<ProtectedRoute allowedRoles={['club','scout']} />}>
            <Route path="/discover" element={<StartupGate><Discover /></StartupGate>} />
          </Route>

          {/* Club only */}
          <Route element={<ProtectedRoute allowedRoles={['club']} />}>
            <Route path="/club/dashboard" element={<StartupGate><ClubDashboard /></StartupGate>} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/erp/*" element={<AdminERP />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="verification" element={<AdminVerification />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="social-posts" element={<AdminSocialPosting />} />
              <Route path="integrations" element={<AdminIntegrations />} />
            </Route>
          </Route>

          <Route path="*" element={<RoleDefaultRedirect />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}