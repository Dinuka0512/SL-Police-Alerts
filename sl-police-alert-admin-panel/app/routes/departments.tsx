import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Building2, Plus, Pencil, Trash2, Eye, Users as UsersIcon,
  CheckCircle2, XCircle
} from "lucide-react";
import { useApp } from "~/context/AppContext";
import { useToast } from "~/context/ToastContext";
import type { DeptStatus } from "~/context/AppContext";
import Badge, { statusToBadge } from "~/components/ui/Badge";
import SearchBar from "~/components/ui/SearchBar";
import ConfirmDialog from "~/components/ui/ConfirmDialog";
import EmptyState from "~/components/ui/EmptyState";
import Modal from "~/components/ui/Modal";

interface DeptFormData {
  name: string;
  code: string;
  description: string;
  status: DeptStatus;
}

interface DeptFormErrors {
  name?: string;
  code?: string;
  description?: string;
}

const EMPTY_FORM: DeptFormData = { name: "", code: "", description: "", status: "Active" };

export default function DepartmentsPage() {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useApp();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<DeptFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<DeptFormErrors>({});
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => departments.filter(d => {
    const q = search.toLowerCase();
    const match = !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return match && matchStatus;
  }), [departments, search, statusFilter]);

  const editDept = editId ? departments.find(d => d.id === editId) : null;
  const viewDept = viewId ? departments.find(d => d.id === viewId) : null;
  const deleteDept = deleteId ? departments.find(d => d.id === deleteId) : null;

  function openAdd() { setForm(EMPTY_FORM); setErrors({}); setAddOpen(true); }
  function openEdit(id: string) {
    const d = departments.find(d => d.id === id)!;
    setForm({ name: d.name, code: d.code, description: d.description, status: d.status });
    setErrors({});
    setEditId(id);
  }

  function setField(k: keyof DeptFormData, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  function validate() {
    const errs: DeptFormErrors = {};
    if (!form.name.trim()) errs.name = "Department name is required";
    if (!form.code.trim()) errs.code = "Department code is required";
    else if (!/^[A-Z0-9]{2,10}$/.test(form.code)) errs.code = "Code must be 2–10 uppercase letters/numbers";
    if (!form.description.trim()) errs.description = "Description is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAdd() {
    if (!validate()) return;
    setSaving(true);
    try {
      await addDepartment(form);
      showToast("success", "Department added", `${form.name} has been created.`);
      setAddOpen(false);
    } catch (err) {
      showToast("error", "Failed to add department", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!validate() || !editId) return;
    setSaving(true);
    try {
      await updateDepartment(editId, form);
      showToast("success", "Department updated", `${form.name} has been updated.`);
      setEditId(null);
    } catch (err) {
      showToast("error", "Failed to update department", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteDepartment(deleteId);
      showToast("success", "Department deleted", `${deleteDept?.name} has been removed.`);
    } catch (err) {
      showToast("error", "Failed to delete department", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleteId(null);
    }
  }

  const DeptFormFields = () => (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor="dept-name">Department Name<span className="required">*</span></label>
        <input id="dept-name" type="text" className={`form-control ${errors.name ? "error" : ""}`}
          placeholder="e.g. Colombo Police Division" value={form.name} onChange={e => setField("name", e.target.value)} />
        {errors.name && <div className="form-error">⚠ {errors.name}</div>}
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="dept-code">Department Code<span className="required">*</span></label>
        <input id="dept-code" type="text" className={`form-control ${errors.code ? "error" : ""}`}
          placeholder="e.g. CPD" value={form.code}
          onChange={e => setField("code", e.target.value.toUpperCase())} />
        {errors.code && <div className="form-error">⚠ {errors.code}</div>}
        <div className="form-hint">2–10 uppercase letters and numbers only</div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="dept-desc">Description<span className="required">*</span></label>
        <textarea id="dept-desc" className={`form-control ${errors.description ? "error" : ""}`}
          placeholder="Brief description of this department's responsibilities"
          value={form.description} onChange={e => setField("description", e.target.value)}
          style={{ minHeight: 90 }} />
        {errors.description && <div className="form-error">⚠ {errors.description}</div>}
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="dept-status">Status</label>
        <select id="dept-status" className="form-control" value={form.status} onChange={e => setField("status", e.target.value as DeptStatus)}>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div className="action-bar">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Departments</h1>
            <p style={{ fontSize: 14, color: "#64748b" }}>{departments.length} departments registered</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd} id="add-dept-btn">
            <Plus size={16} /> Add Department
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-body" style={{ paddingTop: 16, paddingBottom: 16 }}>
            <div className="filter-row">
              <SearchBar value={search} onChange={v => setSearch(v)} placeholder="Search departments..." style={{ flex: 1 }} />
              <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} id="dept-status-filter" style={{ minWidth: 140 }}>
                <option value="all">All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dept cards grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Building2 size={32} />}
            title="No departments found"
            description={search ? "No departments match your search." : "No departments available. Add a department to get started."}
            action={<button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Add Department</button>}
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(dept => (
            <div key={dept.id} className="card" style={{ transition: "box-shadow 0.2s, transform 0.2s" }}>
              <div className="card-body">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 46, height: 46, borderRadius: 12,
                      background: dept.status === "Active" ? "#e0e7ff" : "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: dept.status === "Active" ? "#1a3a6b" : "#94a3b8", flexShrink: 0
                    }}>
                      <Building2 size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{dept.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 20 }}>{dept.code}</span>
                    </div>
                  </div>
                  <Badge variant={statusToBadge(dept.status)} />
                </div>

                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 14 }}>{dept.description}</p>

                <div className="divider" style={{ margin: "12px 0" }} />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2" style={{ fontSize: 13, color: "#475569" }}>
                    <UsersIcon size={14} color="#1a3a6b" />
                    <span><strong>{dept.userCount}</strong> users</span>
                    <span style={{ color: "#cbd5e1" }}>·</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>Created {dept.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="btn-icon" title="View" onClick={() => setViewId(dept.id)} id={`view-dept-${dept.id}`}><Eye size={15} /></button>
                    <button className="btn-icon" title="Edit" onClick={() => openEdit(dept.id)} id={`edit-dept-${dept.id}`}><Pencil size={15} /></button>
                    <button className="btn-icon danger" title="Delete" onClick={() => setDeleteId(dept.id)} id={`delete-dept-${dept.id}`}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Department" size="md"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving} id="save-dept-btn">
            <Plus size={15} />{saving ? "Creating..." : "Create Department"}
          </button>
        </>}>
        <DeptFormFields />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editId} onClose={() => setEditId(null)} title="Edit Department" size="md"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setEditId(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleEdit} disabled={saving} id="update-dept-btn">
            <Pencil size={15} />{saving ? "Saving..." : "Save Changes"}
          </button>
        </>}>
        <DeptFormFields />
      </Modal>

      {/* View Modal */}
      {viewDept && (
        <Modal isOpen={!!viewId} onClose={() => setViewId(null)} title="Department Details" size="md"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setViewId(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => { setViewId(null); openEdit(viewDept.id); }}>
              <Pencil size={14} /> Edit
            </button>
          </>}>
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a3a6b" }}>
                <Building2 size={26} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{viewDept.name}</div>
                <span style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 10px", borderRadius: 20, color: "#64748b", fontWeight: 600 }}>{viewDept.code}</span>
              </div>
            </div>
            <div className="divider" />
            {[
              { label: "Description", value: viewDept.description },
              { label: "Status", value: <Badge variant={statusToBadge(viewDept.status)} /> },
              { label: "Users Assigned", value: `${viewDept.userCount} officers` },
              { label: "Department ID", value: viewDept.id },
              { label: "Created Date", value: viewDept.createdAt },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f8fafc", gap: 16 }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        variant={deleteDept && deleteDept.userCount > 0 ? "warning" : "danger"}
        message={
          deleteDept && deleteDept.userCount > 0 ? (
            <div>
              <p style={{ marginBottom: 10 }}>
                <strong>{deleteDept.name}</strong> has <strong>{deleteDept.userCount} user(s)</strong> assigned to it.
              </p>
              <div style={{
                background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8,
                padding: "10px 14px", fontSize: 13, color: "#92400e", textAlign: "left"
              }}>
                ⚠ Please reassign all users to another department before deleting this department.
              </div>
            </div>
          ) : (
            <>Are you sure you want to delete <strong>{deleteDept?.name}</strong>? This cannot be undone.</>
          )
        }
        confirmLabel={deleteDept && deleteDept.userCount > 0 ? "Force Delete Anyway" : "Delete Department"}
      />
    </div>
  );
}
