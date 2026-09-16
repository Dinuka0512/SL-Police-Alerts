import React from "react";
import { useLocation } from "react-router";
import { Bell, Menu, ChevronRight, Shield } from "lucide-react";
import { useAuth } from "~/context/AuthContext";

const ROUTE_LABELS: Record<string, { title: string; subtitle: string; crumbs?: string[] }> = {
  "/":              { title: "Dashboard", subtitle: "System overview and statistics", crumbs: ["Dashboard"] },
  "/users":         { title: "User Management", subtitle: "Manage police officer accounts", crumbs: ["Dashboard", "Users"] },
  "/users/new":     { title: "Add New User", subtitle: "Create a new police officer account", crumbs: ["Dashboard", "Users", "Add User"] },
  "/departments":   { title: "Department Management", subtitle: "Manage police departments and units", crumbs: ["Dashboard", "Departments"] },
  "/send-alert":    { title: "Send Emergency Alert", subtitle: "Create and dispatch emergency alerts", crumbs: ["Dashboard", "Send Alert"] },
  "/alert-history": { title: "Alert History", subtitle: "View all previously sent alerts", crumbs: ["Dashboard", "Alert History"] },
  "/settings":      { title: "Settings", subtitle: "System and account configuration", crumbs: ["Dashboard", "Settings"] },
};

interface HeaderProps {
  onMenuToggle: () => void;
  notifCount?: number;
}

export default function Header({ onMenuToggle, notifCount = 3 }: HeaderProps) {
  const location = useLocation();
  const { user } = useAuth();

  const initials = user
    ? user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";
  const displayName = user?.fullName ?? "Administrator";
  const displayRole = user?.role ?? "Super Admin";

  const routeKey = Object.keys(ROUTE_LABELS).find(key => {
    if (key === "/") return location.pathname === "/";
    return location.pathname.startsWith(key);
  }) ?? "/";

  const { title, subtitle, crumbs } = ROUTE_LABELS[routeKey] ?? ROUTE_LABELS["/"];

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <header className="top-header">
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          id="mobile-menu-toggle"
        >
          <Menu size={22} />
        </button>

        {/* Title block */}
        <div>
          {crumbs && crumbs.length > 1 && (
            <div className="flex items-center gap-1 mb-1" style={{ fontSize: 11, color: "#94a3b8" }}>
              {crumbs.map((c, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight size={12} />}
                  <span style={{ color: i === crumbs.length - 1 ? "#64748b" : "#94a3b8" }}>{c}</span>
                </React.Fragment>
              ))}
            </div>
          )}
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{title}</h2>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="hide-mobile" style={{ fontSize: 12, color: "#94a3b8" }}>{dateStr}</span>

        {/* Notification Bell */}
        <button
          className="btn-icon"
          style={{ position: "relative" }}
          id="notifications-btn"
          aria-label="Notifications"
        >
          <Bell size={19} color="#475569" />
          {notifCount > 0 && (
            <span style={{
              position: "absolute", top: 3, right: 3,
              width: 16, height: 16, borderRadius: "50%",
              background: "#dc2626", color: "#fff",
              fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #fff"
            }}>
              {notifCount}
            </span>
          )}
        </button>

        {/* Admin Avatar */}
        <div className="flex items-center gap-2" style={{ cursor: "pointer" }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #1a3a6b, #0f2557)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff"
          }}>
            {initials}
          </div>
          <div className="hide-mobile">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{displayName}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{displayRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
