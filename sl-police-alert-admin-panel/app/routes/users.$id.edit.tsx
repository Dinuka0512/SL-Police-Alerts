import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Save, ArrowLeft } from "lucide-react";
import { useApp } from "~/context/AppContext";
import { useToast } from "~/context/ToastContext";
import { isProtectedAdmin } from "~/lib/constants";
import type { UserRole, UserStatus } from "~/context/AppContext";

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
}

function Field({ label, id: fid, error, required, children }: { label: string; id: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={fid}>{label}{required && <span className="required">*</span>}</label>
      {children}
      {error && <div className="form-error">⚠ {error}</div>}
    </div>
  );
}

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const { getUserById, departments, updateUser } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const user = getUserById(id!);
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    departmentId: user?.departmentId ?? "",
    role: (user?.role ?? "Police Officer") as UserRole,
    status: (user?.status ?? "Active") as UserStatus,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        departmentId: user.departmentId,
        role: user.role,
        status: user.status,
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="card">
        <div className="empty-state">
          <p>User not found.</p>
          <Link to="/users" className="btn btn-secondary btn-sm">Back to Users</Link>
        </div>
      </div>
    );
  }

  if (isProtectedAdmin(user.email)) {
    return (
      <div>
        <div className="page-header">
          <Link to="/users" className="btn btn-ghost btn-sm" style={{ marginBottom: 8, padding: "6px 4px" }}>
            <ArrowLeft size={16} /> Back to Users
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Edit User</h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>This account is protected</p>
        </div>
        <div className="card" style={{ maxWidth: 680 }}>
          <div className="empty-state">
            <p>The default administrator account cannot be edited.</p>
            <Link to="/users" className="btn btn-secondary btn-sm">Back to Users</Link>
          </div>
        </div>
      </div>
    );
  }

  const set = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  function validate() {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Please enter a valid email";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!form.departmentId) errs.departmentId = "Please select a department";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await updateUser(id!, form);
      showToast("success", "User updated successfully", `${form.fullName}'s account has been updated.`);
      navigate("/users");
    } catch (err) {
      showToast("error", "Failed to update user", err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/users" className="btn btn-ghost btn-sm" style={{ marginBottom: 8, padding: "6px 4px" }}>
          <ArrowLeft size={16} /> Back to Users
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Edit User</h1>
        <p style={{ fontSize: 14, color: "#64748b" }}>Update account details for {user.fullName}</p>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "linear-gradient(135deg,#1a3a6b,#0f2557)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, color: "#fff"
            }}>
              {user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{user.fullName}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>ID: {user.id} · Editing account</div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex gap-5" style={{ flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <Field label="Full Name" id="fullName" error={errors.fullName} required>
                  <input id="fullName" type="text" className={`form-control ${errors.fullName ? "error" : ""}`} value={form.fullName} onChange={e => set("fullName", e.target.value)} />
                </Field>
                <Field label="Email Address" id="email" error={errors.email} required>
                  <input id="email" type="email" className={`form-control ${errors.email ? "error" : ""}`} value={form.email} onChange={e => set("email", e.target.value)} />
                </Field>
                <Field label="Phone Number" id="phone" error={errors.phone} required>
                  <input id="phone" type="tel" className={`form-control ${errors.phone ? "error" : ""}`} value={form.phone} onChange={e => set("phone", e.target.value)} />
                </Field>
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <Field label="Department" id="departmentId" error={errors.departmentId} required>
                  <select id="departmentId" className={`form-control ${errors.departmentId ? "error" : ""}`} value={form.departmentId} onChange={e => set("departmentId", e.target.value)}>
                    <option value="">— Select Department —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </Field>
                <Field label="Role" id="role" required>
                  <select id="role" className="form-control" value={form.role} onChange={e => set("role", e.target.value as UserRole)}>
                    <option>Admin</option>
                    <option>Police Officer</option>
                    <option>Department Officer</option>
                  </select>
                </Field>
                <Field label="Account Status" id="status" required>
                  <select id="status" className="form-control" value={form.status} onChange={e => set("status", e.target.value as UserStatus)}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="divider" />
            <div className="flex gap-3 justify-end">
              <Link to="/users" className="btn btn-secondary">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={saving} id="save-user-btn">
                <Save size={15} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
