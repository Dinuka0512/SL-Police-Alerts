import React from "react";
import { Link } from "react-router";
import {
  Users, Building2, UserCheck, Send, Bell, AlertTriangle,
  ArrowRight, TrendingUp, Clock, ChevronRight
} from "lucide-react";
import { useApp } from "~/context/AppContext";
import Badge, { priorityToBadge, alertStatusToBadge } from "~/components/ui/Badge";

function StatCard({
  label, value, icon, color, bg, sub
}: { label: string; value: number | string; icon: React.ReactNode; color: string; bg: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrap" style={{ background: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-change">{sub}</div>}
      </div>
    </div>
  );
}

// Simple SVG bar chart
function AlertChart({ alerts }: { alerts: ReturnType<typeof useApp>["alerts"] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const counts = days.map(day => ({
    day,
    label: new Date(day).toLocaleDateString("en-GB", { weekday: "short" }),
    count: alerts.filter(a => a.createdAt.startsWith(day)).length,
  }));

  const maxCount = Math.max(...counts.map(c => c.count), 1);
  const chartH = 120;
  const barW = 28;
  const gap = 14;
  const totalW = counts.length * (barW + gap) - gap + 40;

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 32}`} preserveAspectRatio="xMidYMid meet">
      {counts.map((c, i) => {
        const x = i * (barW + gap) + 20;
        const barH = Math.max((c.count / maxCount) * chartH, 4);
        const y = chartH - barH;
        const today = i === 6;
        return (
          <g key={c.day}>
            <rect
              x={x} y={y}
              width={barW} height={barH}
              rx={5}
              fill={today ? "#1a3a6b" : "#c7d2fe"}
              className="chart-bar"
            />
            {c.count > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={10} fill="#64748b" fontWeight="600">
                {c.count}
              </text>
            )}
            <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize={10} fill={today ? "#1a3a6b" : "#94a3b8"} fontWeight={today ? "700" : "500"}>
              {c.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function DashboardPage() {
  const { departments, users, alerts } = useApp();

  const activeUsers = users.filter(u => u.status === "Active").length;
  const activeDepts = departments.filter(d => d.status === "Active").length;
  const today = new Date().toISOString().split("T")[0];
  const alertsToday = alerts.filter(a => a.createdAt.startsWith(today)).length;
  const emergencyAlerts = alerts.filter(a => a.priority === "Critical").length;
  const recentAlerts = alerts.slice(0, 6);

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid-cols-stats" style={{ marginBottom: 24 }}>
        <StatCard label="Total Users" value={users.length} icon={<Users size={22} />} color="#1a3a6b" bg="#e0e7ff" sub={`${activeUsers} active`} />
        <StatCard label="Total Departments" value={departments.length} icon={<Building2 size={22} />} color="#0369a1" bg="#e0f2fe" sub={`${activeDepts} active`} />
        <StatCard label="Active Users" value={activeUsers} icon={<UserCheck size={22} />} color="#15803d" bg="#dcfce7" sub="Currently active" />
        <StatCard label="Alerts Sent Today" value={alertsToday} icon={<Send size={22} />} color="#7c3aed" bg="#ede9fe" sub="Today's dispatches" />
        <StatCard label="Total Alerts" value={alerts.length} icon={<Bell size={22} />} color="#b45309" bg="#fef3c7" sub="All time" />
        <StatCard label="Emergency Alerts" value={emergencyAlerts} icon={<AlertTriangle size={22} />} color="#dc2626" bg="#fee2e2" sub="Critical priority" />
      </div>

      {/* Main content row */}
      <div className="flex gap-5" style={{ flexWrap: "wrap" }}>
        {/* Recent Alerts */}
        <div className="card flex-1" style={{ minWidth: 320 }}>
          <div className="card-header">
            <div>
              <div className="section-title">Recent Alerts</div>
              <div className="section-subtitle">Latest emergency dispatches</div>
            </div>
            <Link to="/alert-history" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map(alert => (
                  <tr key={alert.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{alert.title}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>By {alert.sentBy}</div>
                    </td>
                    <td><Badge variant={priorityToBadge(alert.priority)} /></td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>
                      <div className="flex items-center gap-1"><Clock size={12} />{new Date(alert.createdAt).toLocaleDateString("en-GB")}</div>
                      <div style={{ color: "#94a3b8" }}>{new Date(alert.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td><Badge variant={alertStatusToBadge(alert.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5" style={{ width: 300, minWidth: 260 }}>
          {/* Alert chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="section-title">Alert Activity</div>
                <div className="section-subtitle">Last 7 days</div>
              </div>
              <TrendingUp size={18} color="#1a3a6b" />
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              <AlertChart alerts={alerts} />
            </div>
          </div>

          {/* Department overview */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="section-title">Departments</div>
                <div className="section-subtitle">User distribution</div>
              </div>
              <Link to="/departments" className="btn-icon"><ChevronRight size={16} /></Link>
            </div>
            <div className="card-body" style={{ paddingTop: 0 }}>
              {departments.slice(0, 5).map(dept => (
                <div key={dept.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: "1px solid #f8fafc"
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{dept.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{dept.code}</div>
                  </div>
                  <div style={{
                    minWidth: 28, height: 28, borderRadius: "50%",
                    background: "#e0e7ff", color: "#1a3a6b",
                    fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {dept.userCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
