import React, { useState } from "react";
import { Outlet, Navigate } from "react-router";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "~/context/AuthContext";
import { useApp } from "~/context/AppContext";

export default function DashboardLayout() {
  const { status } = useAuth();
  const { connected, loading } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#64748b" }}>
        Loading...
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        {!loading && !connected && (
          <div className="offline-banner">
            Server is offline — data is currently unavailable. Please start the backend and refresh.
          </div>
        )}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}