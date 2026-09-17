import React from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function SearchBar({ value, onChange, placeholder = "Search...", style }: SearchBarProps) {
  return (
    <div className="search-wrap" style={{ minWidth: 240, ...style }}>
      <Search className="search-icon" />
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ paddingLeft: 40 }}
        id="global-search"
      />
    </div>
  );
}
