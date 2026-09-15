import React from "react";
import type { AlertPriority, UserStatus, DeptStatus, AlertStatus, DeliveryStatus, UserRole } from "~/context/AppContext";

type BadgeVariant =
  | "active" | "inactive"
  | "delivered" | "pending" | "failed"
  | "sent"
  | "critical" | "high" | "medium" | "low"
  | "admin" | "officer" | "dept-officer";

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  dot?: boolean;
}

const VARIANT_MAP: Record<BadgeVariant, { cls: string; label: string }> = {
  active:      { cls: "badge-active",      label: "Active" },
  inactive:    { cls: "badge-inactive",    label: "Inactive" },
  delivered:   { cls: "badge-delivered",   label: "Delivered" },
  pending:     { cls: "badge-pending",     label: "Pending" },
  failed:      { cls: "badge-failed",      label: "Failed" },
  sent:        { cls: "badge-sent",        label: "Sent" },
  critical:    { cls: "badge-critical",    label: "Critical" },
  high:        { cls: "badge-high",        label: "High" },
  medium:      { cls: "badge-medium",      label: "Medium" },
  low:         { cls: "badge-low",         label: "Low" },
  admin:       { cls: "badge-admin",       label: "Admin" },
  officer:     { cls: "badge-officer",     label: "Police Officer" },
  "dept-officer": { cls: "badge-dept-officer", label: "Department Officer" },
};

export function statusToBadge(status: UserStatus | DeptStatus): BadgeVariant {
  return status === "Active" ? "active" : "inactive";
}

export function priorityToBadge(p: AlertPriority): BadgeVariant {
  return p.toLowerCase() as BadgeVariant;
}

export function alertStatusToBadge(s: AlertStatus): BadgeVariant {
  return s.toLowerCase() as BadgeVariant;
}

export function deliveryStatusToBadge(s: DeliveryStatus): BadgeVariant {
  const map: Record<DeliveryStatus, BadgeVariant> = { Delivered: "delivered", Pending: "pending", Failed: "failed" };
  return map[s];
}

export function roleToBadge(r: UserRole): BadgeVariant {
  if (r === "Admin") return "admin";
  if (r === "Police Officer") return "officer";
  return "dept-officer";
}

export default function Badge({ variant, label, dot = true }: BadgeProps) {
  const { cls, label: defaultLabel } = VARIANT_MAP[variant] ?? { cls: "badge-inactive", label: variant };
  return (
    <span className={`badge ${cls}`}>
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
      )}
      {label ?? defaultLabel}
    </span>
  );
}
