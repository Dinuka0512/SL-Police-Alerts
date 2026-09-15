import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  current: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}

export default function Pagination({ current, total, perPage, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) pages.push(i);
    if (current < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const from = (current - 1) * perPage + 1;
  const to = Math.min(current * perPage, total);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3" style={{ padding: "14px 0 2px" }}>
      <span style={{ fontSize: 13, color: "#64748b" }}>
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> results
      </span>
      <div className="pagination">
        <button
          className="page-btn"
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="page-btn" style={{ cursor: "default" }}>…</span>
          ) : (
            <button
              key={p}
              className={`page-btn ${p === current ? "active" : ""}`}
              onClick={() => onChange(p as number)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="page-btn"
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
