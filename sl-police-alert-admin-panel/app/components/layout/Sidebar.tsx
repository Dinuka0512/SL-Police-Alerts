import React from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  Send,
  History,
  Settings,
  LogOut,
  Shield,
  Bell,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/departments", icon: Building2, label: "Departments" },
  { to: "/send-alert", icon: Send, label: "Send Alert" },
  { to: "/alert-history", icon: History, label: "Alert History" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Shield size={22} color="#60a5fa" />
          </div>
          <div className="sidebar-logo-text">
            <h1>SL Police Alert</h1>
            <p>Admin Dashboard</p>
          </div>
        </div>

        {/* Main Navigation */}
        <div style={{ marginTop: 8 }}>
          <div className="sidebar-section-label">Main Menu</div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                onClick={onClose}
              >
                <Icon className="nav-icon" size={18} />
                <span>{label}</span>
                {label === "Send Alert" && (
                  <span style={{
                    marginLeft: "auto", background: "#dc2626", color: "#fff",
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20
                  }}>NEW</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Settings & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-section-label" style={{ padding: "0 8px 8px" }}>System</div>
          <nav className="sidebar-nav" style={{ padding: "0 0 8px" }}>
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <Settings className="nav-icon" size={18} />
              <span>Settings</span>
            </NavLink>
            <button
              className="nav-item danger"
              onClick={() => {
                onClose();
                // In real app: clear session. Here just navigate to root.
                navigate("/");
              }}
            >
              <LogOut className="nav-icon" size={18} />
              <span>Logout</span>
            </button>
          </nav>

          {/* Admin badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", marginTop: 4
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1e40af,#0f2557)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              fontSize: 13, fontWeight: 700, color: "#fff", border: "2px solid rgba(255,255,255,0.15)"
            }}>SP</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Sunil Perera
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Super Admin</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
