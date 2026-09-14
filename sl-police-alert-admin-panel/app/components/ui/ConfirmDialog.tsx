import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Modal from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "danger", loading = false,
}: ConfirmDialogProps) {
  const iconBg = variant === "danger" ? "#fee2e2" : "#fef3c7";
  const iconColor = variant === "danger" ? "#dc2626" : "#d97706";
  const btnClass = variant === "danger" ? "btn btn-danger" : "btn btn-primary";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div style={{ textAlign: "center" }}>
        <div
          className="confirm-dialog-icon"
          style={{ background: iconBg, color: iconColor }}
        >
          {variant === "danger" ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{title}</h3>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{message}</div>
      </div>
      <div className="modal-footer" style={{ borderTop: "none", paddingTop: 20 }}>
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </button>
        <button className={btnClass} onClick={onConfirm} disabled={loading}>
          {loading ? "Processing..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
