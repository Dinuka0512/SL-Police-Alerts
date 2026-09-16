import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { History, Eye, Trash2, Image as ImageIcon, Clock, Building2, Filter } from "lucide-react";
import { useApp } from "~/context/AppContext";
import { useToast } from "~/context/ToastContext";
import type { AlertPriority, AlertStatus } from "~/context/AppContext";
import Badge, { priorityToBadge, alertStatusToBadge } from "~/components/ui/Badge";
import SearchBar from "~/components/ui/SearchBar";
import Pagination from "~/components/ui/Pagination";
import ConfirmDialog from "~/components/ui/ConfirmDialog";
import EmptyState from "~/components/ui/EmptyState";
import OfflineState from "~/components/ui/OfflineState";
import Modal from "~/components/ui/Modal";

const PER_PAGE = 8;

const PRIORITY_INDICATOR: Record<AlertPriority, string> = {
  Critical: "#dc2626",
  High: "#ea580c",
  Medium: "#d97706",
  Low: "#16a34a",
};

export default function AlertHistoryPage() {
  const { alerts, departments, connected, deleteAlert, getAlertById, getDepartmentById } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const filtered = useMemo(() => alerts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.sentBy.toLowerCase().includes(q);
    const matchPriority = priorityFilter === "all" || a.priority === priorityFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchDept = deptFilter === "all" || a.departments.some(d => d.departmentId === deptFilter);
    return matchSearch && matchPriority && matchStatus && matchDept;
  }), [alerts, search, priorityFilter, statusFilter, deptFilter]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const viewAlert = viewId ? getAlertById(viewId) : null;
  const deleteAlert_ = deleteId ? getAlertById(deleteId) : null;

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteAlert(deleteId);
      showToast("success", "Alert deleted", "The alert has been removed from history.");
    } catch (err) {
      showToast("error", "Failed to delete alert", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="action-bar">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Alert History</h1>
            <p style={{ fontSize: 14, color: "#64748b" }}>{alerts.length} total alerts dispatched</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-body" style={{ paddingTop: 16, paddingBottom: 16 }}>
            <div className="filter-row">
              <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search alerts..." style={{ flex: 1 }} />
              <select className="form-control" value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} id="filter-priority" style={{ minWidth: 130 }}>
                <option value="all">All Priorities</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <select className="form-control" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} id="filter-alert-status" style={{ minWidth: 130 }}>
                <option value="all">All Status</option>
                <option>Sent</option>
                <option>Delivered</option>
                <option>Failed</option>
              </select>
              <select className="form-control" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }} id="filter-alert-dept" style={{ minWidth: 180 }}>
                <option value="all">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {!connected ? (
            <OfflineState />
          ) : paged.length === 0 ? (
            <EmptyState
              icon={<History size={32} />}
              title="No alerts found"
              description={search ? "No alerts match your filters." : "No alerts have been sent yet. Use Send Alert to dispatch your first alert."}
              action={
                <button className="btn btn-primary btn-sm" onClick={() => navigate("/send-alert")}>
                  Send First Alert
                </button>
              }
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Priority</th>
                  <th className="hide-mobile">Sent By</th>
                  <th className="hide-mobile">Departments</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(alert => (
                  <tr key={alert.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {/* Priority bar */}
                        <div style={{ width: 4, height: 36, borderRadius: 2, background: PRIORITY_INDICATOR[alert.priority], flexShrink: 0 }} />
                        {alert.imageUrl ? (
                          <img src={alert.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <ImageIcon size={16} color="#94a3b8" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{alert.title}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>ID: {alert.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge variant={priorityToBadge(alert.priority)} /></td>
                    <td className="hide-mobile" style={{ fontSize: 13, color: "#475569" }}>{alert.sentBy}</td>
                    <td className="hide-mobile">
                      <div className="flex flex-wrap gap-1">
                        {alert.departments.slice(0, 2).map(d => (
                          <span key={d.departmentId} style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 8px", borderRadius: 20, color: "#475569" }}>
                            {getDepartmentById(d.departmentId)?.code ?? d.departmentId}
                          </span>
                        ))}
                        {alert.departments.length > 2 && (
                          <span style={{ fontSize: 11, background: "#e0e7ff", padding: "2px 8px", borderRadius: 20, color: "#1a3a6b" }}>
                            +{alert.departments.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>
                      <div className="flex items-center gap-1"><Clock size={12} />{new Date(alert.createdAt).toLocaleDateString("en-GB")}</div>
                      <div style={{ color: "#94a3b8" }}>{new Date(alert.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td><Badge variant={alertStatusToBadge(alert.status)} /></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn-icon" title="View" id={`view-alert-${alert.id}`} onClick={() => setViewId(alert.id)}>
                          <Eye size={15} />
                        </button>
                        <button className="btn-icon danger" title="Delete" id={`delete-alert-${alert.id}`} onClick={() => setDeleteId(alert.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > PER_PAGE && (
          <div style={{ padding: "0 20px 16px" }}>
            <Pagination current={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {viewAlert && (
        <Modal isOpen={!!viewId} onClose={() => setViewId(null)} title="Alert Details" size="lg"
          footer={<button className="btn btn-secondary" onClick={() => setViewId(null)}>Close</button>}>
          <div>
            {/* Image */}
            {viewAlert.imageUrl && (
              <img src={viewAlert.imageUrl} alt="Alert" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 10, marginBottom: 20 }} />
            )}

            {/* Priority banner */}
            <div className={`priority-${viewAlert.priority.toLowerCase()}`} style={{ borderRadius: 8, padding: "10px 16px", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>🚨 {viewAlert.priority.toUpperCase()} PRIORITY ALERT</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{viewAlert.title}</div>
            </div>

            {/* Description */}
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "14px 16px", marginBottom: 20, fontSize: 14, color: "#334155", lineHeight: 1.7 }}>
              {viewAlert.description}
            </div>

            {/* Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Sent By", value: viewAlert.sentBy },
                { label: "Date & Time", value: new Date(viewAlert.createdAt).toLocaleString("en-GB") },
                { label: "Status", value: <Badge variant={alertStatusToBadge(viewAlert.status)} /> },
                { label: "Priority", value: <Badge variant={priorityToBadge(viewAlert.priority)} /> },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Department Delivery Status */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Delivery Status by Department</div>
              <div className="table-wrap" style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <table className="data-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Code</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewAlert.departments.map(d => {
                      const dept = getDepartmentById(d.departmentId);
                      return (
                        <tr key={d.departmentId}>
                          <td style={{ fontWeight: 600 }}>{dept?.name ?? d.departmentId}</td>
                          <td style={{ color: "#64748b" }}>{dept?.code ?? "—"}</td>
                          <td>
                            <Badge
                              variant={d.status === "Delivered" ? "delivered" : d.status === "Failed" ? "failed" : "pending"}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Alert"
        message={<>Are you sure you want to delete the alert <strong>"{deleteAlert_?.title}"</strong>? This cannot be undone.</>}
        confirmLabel="Delete Alert"
        variant="danger"
      />
    </div>
  );
}
