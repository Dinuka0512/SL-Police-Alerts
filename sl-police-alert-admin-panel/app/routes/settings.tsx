import React, { useState } from "react";
import {
  User, Lock, Bell, Shield, Save, Eye, EyeOff, Check, Info,
  Globe, Database, Clock, Sun
} from "lucide-react";
import { useToast } from "~/context/ToastContext";

type Tab = "profile" | "password" | "notifications" | "system";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);

  // Profile
  const [profile, setProfile] = useState({
    fullName: "Sunil Perera",
    email: "sunil.perera@police.lk",
    phone: "+94 71 234 5678",
    rank: "Superintendent",
    badge: "SP-0001",
  });

  // Password
  const [pass, setPass] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [passErrors, setPassErrors] = useState<{ current?: string; newPass?: string; confirm?: string }>({});

  // Notifications
  const [notifs, setNotifs] = useState({
    emailAlerts: true, smsAlerts: false, browserNotif: true,
    criticalOnly: false, dailySummary: true,
  });

  // System
  const [system, setSystem] = useState({
    timezone: "Asia/Colombo",
    language: "English",
    theme: "Light",
    sessionTimeout: "30",
    auditLog: true,
    twoFactor: false,
  });

  async function save(msg: string) {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    showToast("success", "Settings saved", msg);
  }

  function handlePassSave() {
    const errs: typeof passErrors = {};
    if (!pass.current) errs.current = "Current password is required";
    if (!pass.newPass) errs.newPass = "New password is required";
    else if (pass.newPass.length < 8) errs.newPass = "At least 8 characters";
    if (pass.newPass !== pass.confirm) errs.confirm = "Passwords do not match";
    setPassErrors(errs);
    if (Object.keys(errs).length === 0) {
      setPass({ current: "", newPass: "", confirm: "" });
      save("Password changed successfully.");
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Admin Profile", icon: <User size={15} /> },
    { id: "password", label: "Change Password", icon: <Lock size={15} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={15} /> },
    { id: "system", label: "System", icon: <Shield size={15} /> },
  ];

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Settings</h1>
        <p style={{ fontSize: 14, color: "#64748b" }}>Manage your account and system preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="tabs" style={{ padding: "0 24px" }}>
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)} id={`tab-${t.id}`}>
              <span className="flex items-center gap-2">{t.icon}{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="profile-avatar">{profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{profile.fullName}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Super Administrator</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="flex gap-5" style={{ flexWrap: "wrap" }}>
              {[
                { label: "Full Name", id: "pf-name", key: "fullName" as const, type: "text" },
                { label: "Email Address", id: "pf-email", key: "email" as const, type: "email" },
                { label: "Phone Number", id: "pf-phone", key: "phone" as const, type: "tel" },
                { label: "Rank / Designation", id: "pf-rank", key: "rank" as const, type: "text" },
                { label: "Badge Number", id: "pf-badge", key: "badge" as const, type: "text" },
              ].map(f => (
                <div key={f.id} className="form-group" style={{ flex: 1, minWidth: 240, marginBottom: 16 }}>
                  <label className="form-label" htmlFor={f.id}>{f.label}</label>
                  <input id={f.id} type={f.type} className="form-control"
                    value={profile[f.key]}
                    onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="flex justify-end">
              <button className="btn btn-primary" onClick={() => save("Profile updated successfully.")} disabled={saving} id="save-profile-btn">
                <Save size={15} />{saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {tab === "password" && (
        <div className="card">
          <div className="card-header">
            <div className="section-title">Change Password</div>
            <div className="section-subtitle">Use a strong password with uppercase, lowercase, and numbers</div>
          </div>
          <div className="card-body">
            {[
              { label: "Current Password", id: "cp-current", key: "current" as const, showKey: "current" as const },
              { label: "New Password", id: "cp-new", key: "newPass" as const, showKey: "new" as const },
              { label: "Confirm New Password", id: "cp-confirm", key: "confirm" as const, showKey: "confirm" as const },
            ].map(f => (
              <div key={f.id} className="form-group">
                <label className="form-label" htmlFor={f.id}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <input id={f.id} type={showPass[f.showKey] ? "text" : "password"}
                    className={`form-control ${passErrors[f.key] ? "error" : ""}`}
                    value={pass[f.key]}
                    onChange={e => setPass(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                    onClick={() => setShowPass(s => ({ ...s, [f.showKey]: !s[f.showKey] }))}>
                    {showPass[f.showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passErrors[f.key] && <div className="form-error">⚠ {passErrors[f.key]}</div>}
              </div>
            ))}

            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#0369a1", marginBottom: 20 }}>
              <div className="flex items-center gap-2 mb-1"><Info size={14} /><strong>Password requirements:</strong></div>
              {["At least 8 characters", "One uppercase letter", "One lowercase letter", "One number"].map(r => (
                <div key={r} className="flex items-center gap-2" style={{ marginTop: 4 }}>
                  <Check size={12} color="#0369a1" />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button className="btn btn-primary" onClick={handlePassSave} disabled={saving} id="change-password-btn">
                <Lock size={15} />{saving ? "Saving..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === "notifications" && (
        <div className="card">
          <div className="card-header"><div className="section-title">Notification Preferences</div></div>
          <div className="card-body">
            {[
              { key: "emailAlerts" as const, label: "Email Notifications", desc: "Receive alert notifications via email" },
              { key: "smsAlerts" as const, label: "SMS Notifications", desc: "Receive alert notifications via SMS" },
              { key: "browserNotif" as const, label: "Browser Notifications", desc: "Show desktop browser notifications" },
              { key: "criticalOnly" as const, label: "Critical Alerts Only", desc: "Only notify for Critical priority alerts" },
              { key: "dailySummary" as const, label: "Daily Summary Report", desc: "Receive a daily email summary of all alerts" },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #f8fafc" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{desc}</div>
                </div>
                <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer" }}>
                  <input type="checkbox" checked={notifs[key]} onChange={e => setNotifs(n => ({ ...n, [key]: e.target.checked }))}
                    id={`notif-${key}`} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{
                    position: "absolute", inset: 0, borderRadius: 12,
                    background: notifs[key] ? "#1a3a6b" : "#cbd5e1",
                    transition: "background 0.2s"
                  }}>
                    <span style={{
                      position: "absolute", top: 2, left: notifs[key] ? 22 : 2,
                      width: 20, height: 20, borderRadius: "50%", background: "#fff",
                      transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                    }} />
                  </span>
                </label>
              </div>
            ))}
            <div className="flex justify-end" style={{ marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => save("Notification preferences saved.")} disabled={saving} id="save-notifs-btn">
                <Save size={15} />{saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {tab === "system" && (
        <div className="card">
          <div className="card-header"><div className="section-title">System Settings</div></div>
          <div className="card-body">
            <div className="flex gap-5" style={{ flexWrap: "wrap", marginBottom: 20 }}>
              <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <label className="form-label" htmlFor="sys-timezone"><Clock size={13} style={{ marginRight: 4 }} />Timezone</label>
                <select id="sys-timezone" className="form-control" value={system.timezone} onChange={e => setSystem(s => ({ ...s, timezone: e.target.value }))}>
                  <option value="Asia/Colombo">Asia/Colombo (IST +5:30)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <label className="form-label" htmlFor="sys-lang"><Globe size={13} style={{ marginRight: 4 }} />Language</label>
                <select id="sys-lang" className="form-control" value={system.language} onChange={e => setSystem(s => ({ ...s, language: e.target.value }))}>
                  <option>English</option>
                  <option>Sinhala</option>
                  <option>Tamil</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <label className="form-label" htmlFor="sys-session">Session Timeout (minutes)</label>
                <select id="sys-session" className="form-control" value={system.sessionTimeout} onChange={e => setSystem(s => ({ ...s, sessionTimeout: e.target.value }))}>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>

            <div className="divider" />

            {[
              { key: "auditLog" as const, label: "Enable Audit Log", desc: "Log all admin actions for security compliance" },
              { key: "twoFactor" as const, label: "Two-Factor Authentication", desc: "Add extra security to admin logins" },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #f8fafc" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{desc}</div>
                </div>
                <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer" }}>
                  <input type="checkbox" checked={system[key]} onChange={e => setSystem(s => ({ ...s, [key]: e.target.checked }))}
                    id={`sys-${key}`} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: "absolute", inset: 0, borderRadius: 12, background: system[key] ? "#1a3a6b" : "#cbd5e1", transition: "background 0.2s" }}>
                    <span style={{ position: "absolute", top: 2, left: system[key] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </span>
                </label>
              </div>
            ))}

            <div className="flex justify-end" style={{ marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => save("System settings saved.")} disabled={saving} id="save-system-btn">
                <Save size={15} />{saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version info */}
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#94a3b8" }}>
        SL Police Alert Admin Dashboard · Version 1.0.0 · Sri Lanka Police Service
      </div>
    </div>
  );
}
