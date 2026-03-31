import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export default function AdminERP() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="text-display text-3xl tracking-wide">Admin ERP</div>
        <div className="text-text2 text-sm mt-1">Tabs for data management, verification, analytics, and social posting.</div>
      </div>

      <div className="bg-surface border border-edge rounded-xl p-3 flex flex-wrap gap-2">
        <AdminTab to="/admin/erp/overview" label="Overview" />
        <AdminTab to="/admin/erp/users" label="Users" />
        <AdminTab to="/admin/erp/verification" label="Verification" />
        <AdminTab to="/admin/erp/audit-logs" label="Audit Logs" />
        <AdminTab to="/admin/erp/analytics" label="Analytics" />
        <AdminTab to="/admin/erp/social-posts" label="Social Posting" />
        <AdminTab to="/admin/erp/integrations" label="Integrations" />
      </div>

      <Outlet />
    </div>
  )
}

function AdminTab({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'inline-flex items-center gap-2 px-3 py-2 rounded-md border border-edge',
          'bg-raised/0 hover:bg-raised/50 text-text1 text-sm',
          isActive ? 'bg-raised/60' : 'bg-surface'
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}

