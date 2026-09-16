import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflineState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ background: "#fef3c7", color: "#92400e" }}>
        <WifiOff size={32} />
      </div>
      <h3>Server is offline</h3>
      <p>Could not load data from the backend. Start the server and reload to try again.</p>
      <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>
        <RefreshCw size={14} /> Reload
      </button>
    </div>
  );
}