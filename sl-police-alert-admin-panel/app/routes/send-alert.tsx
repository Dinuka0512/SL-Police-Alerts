import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Send, AlertTriangle, CheckCircle2, Image as ImageIcon,
  Building2, ChevronDown, ArrowLeft
} from "lucide-react";
import { useApp } from "~/context/AppContext";
import { useToast } from "~/context/ToastContext";
import { useAuth } from "~/context/AuthContext";
import type { AlertPriority, AlertDeptDelivery } from "~/context/AppContext";
import ImageUpload from "~/components/ui/ImageUpload";
import Modal from "~/components/ui/Modal";
import Badge, { priorityToBadge } from "~/components/ui/Badge";

interface FormData {
  title: string;
  description: string;
  priority: AlertPriority;
  selectedDepts: string[];
  imageUrl: string | null;
}

interface FormErrors {
  title?: string;
  description?: string;
  departments?: string;
}

const PRIORITY_COLORS: Record<AlertPriority, { bg: string; border: string; text: string }> = {
  Critical: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  High:     { bg: "#ffedd5", border: "#fdba74", text: "#9a3412" },
  Medium:   { bg: "#fef3c7", border: "#fde68a", text: "#92400e" },
  Low:      { bg: "#dcfce7", border: "#86efac", text: "#14532d" },
};

export default function SendAlertPage() {
  const { departments, addAlert } = useApp();
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    title: "", description: "", priority: "High",
    selectedDepts: [], imageUrl: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function setField(k: keyof FormData, v: unknown) {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  function toggleDept(id: string) {
    setForm(prev => ({
      ...prev,
      selectedDepts: prev.selectedDepts.includes(id)
        ? prev.selectedDepts.filter(d => d !== id)
        : [...prev.selectedDepts, id],
    }));
    setErrors(prev => ({ ...prev, departments: undefined }));
  }

  function toggleAll() {
    const activeDepts = departments.filter(d => d.status === "Active").map(d => d.id);
    const allSelected = activeDepts.every(id => form.selectedDepts.includes(id));
    setForm(prev => ({ ...prev, selectedDepts: allSelected ? [] : activeDepts }));
    setErrors(prev => ({ ...prev, departments: undefined }));
  }

  function validate() {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = "Alert title is required";
    else if (form.title.trim().length < 5) errs.title = "Title must be at least 5 characters";
    if (!form.description.trim()) errs.description = "Description is required";
    else if (form.description.trim().length < 20) errs.description = "Description must be at least 20 characters";
    if (form.selectedDepts.length === 0) errs.departments = "Please select at least one department";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) setConfirmOpen(true);
  }

  async function handleSend() {
    setSending(true);

    const depts: AlertDeptDelivery[] = form.selectedDepts.map(id => ({
      departmentId: id,
      status: "Delivered",
    }));

    try {
      await addAlert({
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: "Delivered",
        imageUrl: form.imageUrl,
        sentBy: user?.fullName ?? "Administrator",
        departments: depts,
      });
      setConfirmOpen(false);
      setSent(true);
      showToast("success", "Emergency alert sent successfully!", `Alert dispatched to ${form.selectedDepts.length} department(s).`);
    } catch (err) {
      showToast("error", "Failed to send alert", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  const activeDepts = departments.filter(d => d.status === "Active");
  const allSelected = activeDepts.every(d => form.selectedDepts.includes(d.id));
  const selectedDeptNames = departments.filter(d => form.selectedDepts.includes(d.id)).map(d => d.name);
  const pc = PRIORITY_COLORS[form.priority];

  if (sent) {
    return (
      <div className="card" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div className="card-body" style={{ padding: "48px 40px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#dcfce7", color: "#16a34a",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px"
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
            Alert Sent Successfully!
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.7 }}>
            Your emergency alert has been dispatched to all selected departments.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => navigate("/alert-history")}>
              View Alert History
            </button>
            <button className="btn btn-primary" onClick={() => { setSent(false); setForm({ title: "", description: "", priority: "High", selectedDepts: [], imageUrl: null }); }}>
              <Send size={15} /> Send Another Alert
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#fee2e2", border: "1px solid #fca5a5",
          borderRadius: 10, padding: "12px 18px", marginBottom: 20
        }}>
          <AlertTriangle size={18} color="#dc2626" />
          <p style={{ fontSize: 13, color: "#991b1b", fontWeight: 500 }}>
            You are about to send a live emergency alert. Please verify all details carefully before dispatching.
          </p>
        </div>
      </div>

      <form onSubmit={handleReview} noValidate>
        <div className="flex gap-5" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Left column */}
          <div style={{ flex: 2, minWidth: 300 }}>
            {/* Alert Image */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} color="#1a3a6b" />
                  <span className="section-title">Alert Image</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>(Optional)</span>
                </div>
              </div>
              <div className="card-body">
                <ImageUpload value={form.imageUrl} onChange={v => setField("imageUrl", v)} />
              </div>
            </div>

            {/* Alert Details */}
            <div className="card">
              <div className="card-header">
                <span className="section-title">Alert Details</span>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="alert-title">
                    Alert Title<span className="required">*</span>
                  </label>
                  <input
                    id="alert-title"
                    type="text"
                    className={`form-control ${errors.title ? "error" : ""}`}
                    placeholder='e.g. "Major Road Accident Reported"'
                    value={form.title}
                    onChange={e => setField("title", e.target.value)}
                  />
                  {errors.title && <div className="form-error">⚠ {errors.title}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="alert-description">
                    Description<span className="required">*</span>
                  </label>
                  <textarea
                    id="alert-description"
                    className={`form-control ${errors.description ? "error" : ""}`}
                    placeholder="Provide full details of the emergency situation. Officers will receive this information."
                    value={form.description}
                    onChange={e => setField("description", e.target.value)}
                    style={{ minHeight: 150 }}
                  />
                  {errors.description && <div className="form-error">⚠ {errors.description}</div>}
                  <div className="form-hint">{form.description.length} characters · Minimum 20</div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="alert-priority">
                    Priority Level<span className="required">*</span>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    {(["Low", "Medium", "High", "Critical"] as AlertPriority[]).map(p => {
                      const pc2 = PRIORITY_COLORS[p];
                      const sel = form.priority === p;
                      return (
                        <button
                          key={p} type="button"
                          onClick={() => setField("priority", p)}
                          style={{
                            padding: "10px 6px", borderRadius: 8,
                            background: sel ? pc2.bg : "#f8fafc",
                            border: `2px solid ${sel ? pc2.border : "#e2e8f0"}`,
                            color: sel ? pc2.text : "#64748b",
                            fontWeight: 600, fontSize: 13, cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                          id={`priority-${p.toLowerCase()}`}
                        >
                          {p === "Critical" && "🔴 "}
                          {p === "High" && "🟠 "}
                          {p === "Medium" && "🟡 "}
                          {p === "Low" && "🟢 "}
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Department selection */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="section-title">Select Departments</span>
                  <div className="section-subtitle">{form.selectedDepts.length} of {activeDepts.length} selected</div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={toggleAll}
                  id="select-all-depts"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="card-body">
                {errors.departments && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#991b1b", marginBottom: 12 }}>
                    ⚠ {errors.departments}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeDepts.map(dept => {
                    const selected = form.selectedDepts.includes(dept.id);
                    return (
                      <label
                        key={dept.id}
                        className={`dept-checkbox-item ${selected ? "selected" : ""}`}
                        htmlFor={`dept-${dept.id}`}
                      >
                        <input
                          type="checkbox"
                          id={`dept-${dept.id}`}
                          checked={selected}
                          onChange={() => toggleDept(dept.id)}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{dept.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{dept.code} · {dept.userCount} officers</div>
                        </div>
                      </label>
                    );
                  })}
                  {activeDepts.length === 0 && (
                    <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>
                      No active departments available.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Priority preview */}
            {form.priority && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-body" style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Preview</div>
                  <div style={{ borderRadius: 8, padding: 12, background: pc.bg, border: `1px solid ${pc.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: pc.text, marginBottom: 4 }}>
                      🚨 {form.priority.toUpperCase()} PRIORITY
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                      {form.title || "Alert title will appear here"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Send button */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-emergency" id="review-alert-btn">
            <AlertTriangle size={17} />
            Review & Send Alert
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Emergency Alert"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)} disabled={sending}>Cancel</button>
            <button className="btn btn-emergency" onClick={handleSend} disabled={sending} id="confirm-send-btn">
              <Send size={15} />
              {sending ? "Sending..." : "Send Alert"}
            </button>
          </>
        }
      >
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
          <div className="flex items-center gap-2" style={{ color: "#991b1b", fontWeight: 600, fontSize: 14 }}>
            <AlertTriangle size={16} /> Are you sure you want to send this emergency alert?
          </div>
          <p style={{ fontSize: 13, color: "#b91c1c", marginTop: 6 }}>
            This alert will be immediately dispatched to the selected departments.
          </p>
        </div>

        {form.imageUrl && (
          <img src={form.imageUrl} alt="Alert" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: 16 }} />
        )}

        {[
          { label: "Alert Title", value: form.title },
          { label: "Priority", value: <Badge variant={priorityToBadge(form.priority)} /> },
          { label: "Departments", value: selectedDeptNames.join(", ") },
          { label: "Recipients", value: `${form.selectedDepts.length} department(s)` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f8fafc", gap: 16 }}>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{value}</span>
          </div>
        ))}

        <div style={{ marginTop: 14, background: "#f8fafc", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#475569" }}>
          <strong>Description:</strong> {form.description}
        </div>
      </Modal>
    </div>
  );
}
