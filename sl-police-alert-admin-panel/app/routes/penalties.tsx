import React, { useState, useMemo } from "react";
import { CarFront, Receipt, Trash2, BadgeCheck, CircleDollarSign, UserRound, MapPin, CalendarDays } from "lucide-react";
import { useApp } from "~/context/AppContext";
import { useToast } from "~/context/ToastContext";
import Badge, { penaltyStatusToBadge } from "~/components/ui/Badge";
import SearchBar from "~/components/ui/SearchBar";
import ConfirmDialog from "~/components/ui/ConfirmDialog";
import EmptyState from "~/components/ui/EmptyState";
import OfflineState from "~/components/ui/OfflineState";

export default function PenaltiesPage() {
  const { penalties, connected, updatePenalty, deletePenalty, getPenaltyById } = useApp();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const paidCount = useMemo(() => penalties.filter(p => p.status === "Paid").length, [penalties]);

  const filtered = useMemo(() => penalties.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.violation.toLowerCase().includes(q) ||
      p.vehicle.toLowerCase().includes(q) ||
      p.nic.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  }), [penalties, search, statusFilter]);

  async function handleMarkPaid(id: string) {
    setUpdatingId(id);
    try {
      await updatePenalty(id, { status: "Paid" });
      showToast("success", "Penalty marked as paid", "The penalty has been updated to Paid.");
    } catch (err) {
      showToast("error", "Failed to update penalty", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const item = getPenaltyById(deleteId);
    try {
      await deletePenalty(deleteId);
      showToast("success", "Penalty deleted", `${item?.violation ?? "Penalty"} has been removed.`);
    } catch (err) {
      showToast("error", "Failed to delete penalty", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="action-bar">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Penalties</h1>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              {penalties.length} penalties • {paidCount} paid • {penalties.length - paidCount} not paid
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-body" style={{ paddingTop: 16, paddingBottom: 16 }}>
            <div className="filter-row">
              <SearchBar value={search} onChange={setSearch} placeholder="Search penalties..." style={{ flex: 1 }} />
              <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} id="penalty-status-filter" style={{ minWidth: 150 }}>
                <option value="all">All Payments</option>
                <option>Not paid</option>
                <option>Paid</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {!connected ? (
        <OfflineState />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Receipt size={32} />}
            title="No penalties found"
            description={search ? "No penalties match your search." : "No penalties have been recorded yet."}
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map(penalty => {
            const isPaid = penalty.status === "Paid";
            return (
              <div key={penalty.id} className="card" style={{ transition: "box-shadow 0.2s, transform 0.2s" }}>
                <div className="card-body">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 46, height: 46, borderRadius: 12,
                        background: isPaid ? "#dcfce7" : "#fef3c7",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: isPaid ? "#15803d" : "#92400e", flexShrink: 0
                      }}>
                        <Receipt size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                          {penalty.violation}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 20 }}>
                          {penalty.code || "GENERAL"}
                        </span>
                      </div>
                    </div>
                    <Badge variant={penaltyStatusToBadge(penalty.status)} />
                  </div>

                  {/* Details */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", fontSize: 12.5, color: "#475569", marginBottom: 14 }}>
                    <div className="flex items-center gap-1.5">
                      <CircleDollarSign size={14} color="#1a3a6b" />
                      <strong style={{ color: "#0f172a" }}>{penalty.fee}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CarFront size={14} color="#1a3a6b" />
                      {penalty.vehicle || "—"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserRound size={14} color="#1a3a6b" />
                      {penalty.nic || "—"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={14} color="#1a3a6b" />
                      {penalty.date || "—"}
                    </div>
                    <div className="flex items-center gap-1.5" style={{ gridColumn: "1 / -1" }}>
                      <MapPin size={14} color="#1a3a6b" />
                      {penalty.location || "No location"}
                    </div>
                  </div>

                  <div className="divider" style={{ margin: "12px 0" }} />

                  <div className="flex items-center justify-between">
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      {penalty.issuedBy ? `Issued by ${penalty.issuedBy}` : "No issuer"}
                    </div>
                    <div className="flex items-center gap-1">
                      {isPaid ? (
                        <button className="btn btn-success btn-sm" disabled id={`paid-${penalty.id}`}>
                          <BadgeCheck size={15} /> Paid
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleMarkPaid(penalty.id)}
                          disabled={updatingId === penalty.id}
                          id={`mark-paid-${penalty.id}`}
                        >
                          {updatingId === penalty.id ? "Updating..." : "Mark as Paid"}
                        </button>
                      )}
                      <button className="btn-icon danger" title="Delete" onClick={() => setDeleteId(penalty.id)} id={`delete-penalty-${penalty.id}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Penalty"
        variant="danger"
        message={<>Are you sure you want to delete <strong>{getPenaltyById(deleteId ?? "")?.violation}</strong>? This cannot be undone.</>}
        confirmLabel="Delete Penalty"
      />
    </div>
  );
}