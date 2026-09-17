import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, RefreshCw } from "lucide-react";

interface ImageUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (value) {
    return (
      <div className="image-preview-wrap">
        <img src={value} alt="Alert preview" />
        <div className="image-preview-overlay">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCw size={14} /> Replace
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => onChange(null)}
          >
            <X size={14} /> Remove
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleChange} />
      </div>
    );
  }

  return (
    <div
      className={`image-upload-zone ${dragOver ? "drag-over" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div style={{ pointerEvents: "none" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: "#e0e7ff",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#1a3a6b"
          }}>
            <Upload size={24} />
          </div>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
          Drag & drop an image here
        </p>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
          or click to browse files
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#94a3b8", fontSize: 12 }}>
          <ImageIcon size={14} />
          <span>PNG, JPG, WEBP up to 10MB</span>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleChange} />
    </div>
  );
}
