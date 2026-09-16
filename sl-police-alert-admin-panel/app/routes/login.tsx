import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { Shield, Eye, EyeOff, LogIn, WifiOff } from "lucide-react";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";

const demoHint = {
  email: "admin@police.lk",
  password: "Admin@123",
};

export default function LoginPage() {
  const { status, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await login(email.trim(), password);
      showToast("success", "Welcome back", "Signed in successfully.");
      navigate("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid email or password";
      setError(msg);
      showToast("error", "Login failed", msg);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo() {
    setEmail(demoHint.email);
    setPassword(demoHint.password);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Shield size={26} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          SL Police Alert
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
          Admin Panel — sign in to continue
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className={`form-control ${error ? "error" : ""}`}
              placeholder="admin@police.lk"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError("");
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                className={`form-control ${error ? "error" : ""}`}
                placeholder="Enter your password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError("");
                }}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 4 }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            disabled={submitting}
            id="login-submit-btn"
          >
            <LogIn size={15} />
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div
          style={{
            marginTop: 22,
            padding: "12px 14px",
            borderRadius: 10,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            fontSize: 12,
            color: "#475569",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <WifiOff size={13} /> Demo account
          </div>
          <div>
            Email: <strong>{demoHint.email}</strong>
          </div>
          <div>
            Password: <strong>{demoHint.password}</strong>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, padding: "4px 10px" }} onClick={fillDemo}>
            Use demo credentials
          </button>
        </div>
      </div>
    </div>
  );
}