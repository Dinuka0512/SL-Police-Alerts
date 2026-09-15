import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { UserPlus, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useApp } from "~/context/AppContext";
import { useToast } from "~/context/ToastContext";
import type { UserRole, UserStatus } from "~/context/AppContext";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  departmentId: string;
  role: UserRole;
  status: UserStatus;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  departmentId?: string;
}

const INITIAL: FormData = {
  fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  departmentId: "", role: "Police Officer", status: "Active",
};

export default function AddUserPage() {
  const { departments, addUser } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Please enter a valid email address";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\+?[\d\s\-()]{9,15}$/.test(form.phone)) errs.phone = "Please enter a valid phone number";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errs.password = "Password must contain uppercase, lowercase, and a number";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!form.departmentId) errs.departmentId = "Please select a department";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    addUser({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      departmentId: form.departmentId,
      role: form.role,
      status: form.status,
    });
    showToast("success", "User created successfully", `${form.fullName} has been added to the system.`);
    setSaving(false);
    navigate("/users");
  }

  const Field = ({ label, id, error, required, children }: { label: string; id: string; error?: string; required?: boolean; children: React.ReactNode }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}{required && <span className="required">*</span>}
      </label>
      {children}
      {error && <div className="form-error">⚠ {error}</div>}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <Link to="/users" className="btn btn-ghost btn-sm" style={{ marginBottom: 8, padding: "6px 4px" }}>
          <ArrowLeft size={16} /> Back to Users
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Add New User</h1>
        <p style={{ fontSize: 14, color: "#64748b" }}>Create a new police officer account</p>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a3a6b" }}>
              <UserPlus size={18} />
            </div>
            <div>
              <div className="section-title">User Information</div>
              <div className="section-subtitle">Fill in all required fields to create the account</div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex gap-5" style={{ flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <Field label="Full Name" id="fullName" error={errors.fullName} required>
                  <input
                    id="fullName"
                    type="text"
                    className={`form-control ${errors.fullName ? "error" : ""}`}
                    placeholder="e.g. Sunil Perera"
                    value={form.fullName}
                    onChange={e => set("fullName", e.target.value)}
                  />
                </Field>

                <Field label="Email Address" id="email" error={errors.email} required>
                  <input
                    id="email"
                    type="email"
                    className={`form-control ${errors.email ? "error" : ""}`}
                    placeholder="officer@police.lk"
                    value={form.email}
                    onChange={e => set("email", e.target.value)}
                  />
                </Field>

                <Field label="Phone Number" id="phone" error={errors.phone} required>
                  <input
                    id="phone"
                    type="tel"
                    className={`form-control ${errors.phone ? "error" : ""}`}
                    placeholder="+94 71 234 5678"
                    value={form.phone}
                    onChange={e => set("phone", e.target.value)}
                  />
                </Field>

                <Field label="Department" id="departmentId" error={errors.departmentId} required>
                  <select
                    id="departmentId"
                    className={`form-control ${errors.departmentId ? "error" : ""}`}
                    value={form.departmentId}
                    onChange={e => set("departmentId", e.target.value)}
                  >
                    <option value="">— Select Department —</option>
                    {departments.filter(d => d.status === "Active").map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <Field label="Password" id="password" error={errors.password} required>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      className={`form-control ${errors.password ? "error" : ""}`}
                      placeholder="Min 8 chars, upper, lower, number"
                      value={form.password}
                      onChange={e => set("password", e.target.value)}
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm Password" id="confirmPassword" error={errors.confirmPassword} required>
                  <div style={{ position: "relative" }}>
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      className={`form-control ${errors.confirmPassword ? "error" : ""}`}
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={e => set("confirmPassword", e.target.value)}
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                <Field label="Role" id="role" required>
                  <select
                    id="role"
                    className="form-control"
                    value={form.role}
                    onChange={e => set("role", e.target.value as UserRole)}
                  >
                    <option>Admin</option>
                    <option>Police Officer</option>
                    <option>Department Officer</option>
                  </select>
                </Field>

                <Field label="Account Status" id="status" required>
                  <select
                    id="status"
                    className="form-control"
                    value={form.status}
                    onChange={e => set("status", e.target.value as UserStatus)}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="divider" />

            <div className="flex gap-3 justify-end">
              <Link to="/users" className="btn btn-secondary">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={saving} id="create-user-btn">
                <UserPlus size={15} />
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
