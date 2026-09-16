import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  UserPlus, Eye, Pencil, Trash2, Users as UsersIcon,
  Phone, Mail, ChevronDown
} from "lucide-react";
import { useApp } from "~/context/AppContext";
import { useToast } from "~/context/ToastContext";
import Badge, { statusToBadge, roleToBadge } from "~/components/ui/Badge";
import SearchBar from "~/components/ui/SearchBar";
import Pagination from "~/components/ui/Pagination";
import ConfirmDialog from "~/components/ui/ConfirmDialog";
import EmptyState from "~/components/ui/EmptyState";
import Modal from "~/components/ui/Modal";

const PER_PAGE = 8;

export default function UsersPage() {
  const { users, departments, deleteUser, getDepartmentById } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const dept = getDepartmentById(u.departmentId)?.name ?? "";
      const q = search.toLowerCase();
      const matchSearch = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q) || dept.toLowerCase().includes(q);
      const matchDept = deptFilter === "all" || u.departmentId === deptFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchDept && matchStatus && matchRole;
    });
  }, [users, search, deptFilter, statusFilter, roleFilter, getDepartmentById]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const selectedUser = viewUser ? users.find(u => u.id === viewUser) : null;
  const deleteTargetUser = deleteId ? users.find(u => u.id === deleteId) : null;

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteUser(deleteId);
      showToast("success", "User deleted", "The user account has been removed.");
    } catch (err) {
      showToast("error", "Failed to delete user", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="action-bar">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Users</h1>
            <p style={{ fontSize: 14, color: "#64748b" }}>{users.length} registered accounts</p>
          </div>
          <Link to="/users/new" className="btn btn-primary" id="add-user-btn">
            <UserPlus size={16} /> Add New User
          </Link>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-body" style={{ paddingTop: 16, paddingBottom: 16 }}>
            <div className="filter-row">
              <SearchBar
                value={search}
                onChange={v => { setSearch(v); setPage(1); }}
                placeholder="Search users..."
                style={{ flex: 1 }}
              />
              <div style={{ position: "relative" }}>
                <select
                  className="form-control"
                  value={deptFilter}
                  onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
                  id="filter-dept"
                  style={{ paddingRight: 36, minWidth: 180 }}
                >
                  <option value="all">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <select
                className="form-control"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                id="filter-status"
                style={{ minWidth: 130 }}
              >
                <option value="all">All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <select
                className="form-control"
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                id="filter-role"
                style={{ minWidth: 180 }}
              >
                <option value="all">All Roles</option>
                <option>Admin</option>
                <option>Police Officer</option>
                <option>Department Officer</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          {paged.length === 0 ? (
            <EmptyState
              icon={<UsersIcon size={32} />}
              title="No users found"
              description={search ? "No users match your search criteria. Try adjusting your filters." : "No users have been added yet. Add a new user to get started."}
              action={
                <Link to="/users/new" className="btn btn-primary btn-sm">
                  <UserPlus size={14} /> Add User
                </Link>
              }
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th className="hide-mobile">Email</th>
                  <th className="hide-mobile">Phone</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="hide-mobile">Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((user, idx) => {
                  const dept = getDepartmentById(user.departmentId);
                  return (
                    <tr key={user.id}>
                      <td style={{ color: "#94a3b8", fontSize: 12 }}>
                        {(page - 1) * PER_PAGE + idx + 1}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: "linear-gradient(135deg, #1a3a6b, #0f2557)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0
                          }}>
                            {user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{user.fullName}</span>
                        </div>
                      </td>
                      <td className="hide-mobile" style={{ color: "#475569" }}>
                        <div className="flex items-center gap-1"><Mail size={12} color="#94a3b8" />{user.email}</div>
                      </td>
                      <td className="hide-mobile">
                        <div className="flex items-center gap-1" style={{ color: "#475569" }}><Phone size={12} color="#94a3b8" />{user.phone}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "#334155" }}>{dept?.name ?? "—"}</span>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{dept?.code}</div>
                      </td>
                      <td><Badge variant={roleToBadge(user.role)} /></td>
                      <td><Badge variant={statusToBadge(user.status)} /></td>
                      <td className="hide-mobile" style={{ fontSize: 12, color: "#64748b" }}>{user.createdAt}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn-icon"
                            title="View"
                            id={`view-user-${user.id}`}
                            onClick={() => setViewUser(user.id)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Edit"
                            id={`edit-user-${user.id}`}
                            onClick={() => navigate(`/users/${user.id}/edit`)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete"
                            id={`delete-user-${user.id}`}
                            onClick={() => setDeleteId(user.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!viewUser}
          onClose={() => setViewUser(null)}
          title="User Details"
          size="md"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setViewUser(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewUser(null); navigate(`/users/${selectedUser.id}/edit`); }}>
                <Pencil size={14} /> Edit User
              </button>
            </>
          }
        >
          <div>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="profile-avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
                {selectedUser.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{selectedUser.fullName}</div>
                <Badge variant={roleToBadge(selectedUser.role)} dot={false} />
              </div>
            </div>

            <div className="divider" />

            {/* Details */}
            {[
              { label: "Email", value: selectedUser.email },
              { label: "Phone", value: selectedUser.phone },
              { label: "Department", value: getDepartmentById(selectedUser.departmentId)?.name ?? "—" },
              { label: "Status", value: <Badge variant={statusToBadge(selectedUser.status)} /> },
              { label: "Account Created", value: selectedUser.createdAt },
              { label: "Last Active", value: selectedUser.lastActive },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</span>
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
        title="Delete User"
        message={
          <>
            Are you sure you want to delete <strong>{deleteTargetUser?.fullName}</strong>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete User"
        variant="danger"
      />
    </div>
  );
}
