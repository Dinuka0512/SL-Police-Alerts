import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  titleIcon?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer, size = "md", titleIcon }: ModalProps) {
  if (!isOpen) return null;

  const sizeClass = size === "lg" ? "modal-lg" : size === "sm" ? "modal-sm" : "";

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${sizeClass}`} role="dialog" aria-modal="true">
        {title && (
          <div className="modal-header">
            <div className="flex items-center gap-3">
              {titleIcon && (
                <span className="text-[#1a3a6b]">{titleIcon}</span>
              )}
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
            </div>
            <button className="btn-icon" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
