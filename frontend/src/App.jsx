import React from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'

import DashboardNavbar from './components/shared/DashboardNavbar.jsx'
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
import Profile        from './pages/Profile.jsx'
import Leaderboards from './pages/Leaderboards.jsx'
import AdminERP       from './pages/AdminERP.jsx'
import Startup        from './pages/Startup.jsx'
import StartupGate    from './components/onboarding/StartupGate.jsx'
import AdminOverview  from './pages/admin/AdminOverview.jsx'
import AdminUsers     from './pages/admin/AdminUsers.jsx'
import AdminVerification from './pages/admin/AdminVerification.jsx'
import AdminAthletes  from './pages/admin/AdminAthletes.jsx'
import AdminClubs     from './pages/admin/AdminClubs.jsx'
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx'
import { useAuth } from './context/AuthContext.jsx'

const ShellLayout = () => {
  return (
    <div className="min-h-screen bg-background text-text1 flex flex-col font-body">
      <DashboardNavbar />
      <main className="flex-1 overflow-y-auto pt-24 md:pt-28 pb-28 md:pb-10 px-4 md:px-6 bg-background">
        <div className="max-w-6xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
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

        <Route path="/clubs/:id" element={<ClubProfile />} />

        {/* Authenticated shell */}
        <Route element={<ShellLayout />}>

          {/* All authenticated roles */}
          <Route element={<ProtectedRoute allowedRoles={['athlete','club','scout']} />}>
            <Route path="/startup"       element={<StartupGate><Startup /></StartupGate>} />
            <Route path="/feed"           element={<StartupGate><Feed /></StartupGate>} />
            <Route path="/messages"       element={<StartupGate><Messages /></StartupGate>} />
            <Route path="/opportunities"  element={<StartupGate><Opportunities /></StartupGate>} />
            <Route path="/athletes/:id"   element={<StartupGate><AthleteProfile /></StartupGate>} />
          {/* Club profile route moved above for public access */}
            <Route path="/profile"        element={<StartupGate><Profile /></StartupGate>} />
            <Route path="/leaderboards" element={<StartupGate><Leaderboards /></StartupGate>} />
          </Route>

          {/* Legacy analytics route -> profile */}
          <Route path="/analytics" element={<Navigate to="/profile" replace />} />

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
              <Route path="athletes" element={<AdminAthletes />} />
              <Route path="clubs" element={<AdminClubs />} />
              <Route path="verification" element={<AdminVerification />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>
          </Route>

          <Route path="*" element={<RoleDefaultRedirect />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}