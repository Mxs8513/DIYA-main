import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { api, saveAuth } from "../../../lib/api";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState(""); // transient "waking server…" message
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api.auth.login(email, password);
      saveAuth(token, user);
      navigate(user.role === "professor" ? "/professor" : "/groups");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  // One-click demo access — logs in with the seeded accounts so a recruiter can
  // explore instantly without knowing any credentials. The API runs on a free
  // tier that sleeps when idle, so the first request after a nap can fail/502
  // while it wakes (~30–50s). We retry transparently with a friendly message
  // instead of surfacing a scary error.
  const demoLogin = async (role: "professor" | "student") => {
    const creds = role === "professor"
      ? { email: "dr.chen@university.edu", password: "demo1234" }
      : { email: "alex.r@uni.edu", password: "demo1234" };
    setError("");
    setLoading(true);
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const maxAttempts = 8;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { token, user } = await api.auth.login(creds.email, creds.password);
        saveAuth(token, user);
        setStatus("");
        navigate(user.role === "professor" ? "/professor" : "/groups");
        return;
      } catch {
        if (attempt < maxAttempts) {
          setStatus(`Waking up the demo server… (~30s on first load) · attempt ${attempt}/${maxAttempts}`);
          await sleep(5000);
        }
      }
    }
    setStatus("");
    setError("The demo server is taking longer than usual to wake up. Please give it a minute and click again.");
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to top, #a22237 0%, #5C1E26 25%, #4a1530 45%, #3d1542 65%, #2e1240 80%, #270115 100%)",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "50%", opacity: 0.3 }} viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="wave3" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#270115" /><stop offset="40%" stopColor="#4a1340" /><stop offset="100%" stopColor="#a22237" /></linearGradient></defs>
        <path d="M0 200 C200 60 500 320 720 180 C940 40 1200 280 1440 140 L1440 0 L0 0Z" fill="url(#wave3)" />
      </svg>
      <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "55%", opacity: 0.5 }} viewBox="0 0 1440 500" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="wave2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#c93050" /><stop offset="50%" stopColor="#6b1a30" /><stop offset="100%" stopColor="#42184a" /></linearGradient></defs>
        <path d="M0 280 C360 400 600 160 900 300 C1100 400 1300 220 1440 340 L1440 500 L0 500Z" fill="url(#wave2)" />
      </svg>

      <div style={{
        color: "#5C1E26", padding: "24px 28px", border: "2px solid #D6D6D6", borderRadius: 16, width: 380,
        boxShadow: "0 16px 60px rgba(0,0,0,0.25)", backgroundColor: "#fff", position: "relative", zIndex: 1,
      }}>
        <h1 style={{ fontFamily: "Italiana", fontSize: 72, fontWeight: 300, margin: "0 0 4px" }}>D.I.Y.A</h1>
        <h2 style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 18, color: "#111", margin: "0 0 6px" }}>
          Log in or{" "}
          <Link to="/signup" style={{ color: "#4285F4", textDecoration: "underline" }}>sign up</Link>
        </h2>
        <p style={{ fontSize: 14, color: "#666", margin: "0 0 16px" }}>Enter your credentials to continue</p>

        {/* One-click demo access for reviewers — no account needed */}
        <div style={{ border: "1.5px solid rgba(162,34,55,0.25)", backgroundColor: "rgba(162,34,55,0.04)", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "#a22237", marginBottom: 8 }}>👋 Reviewing this project? Try the live demo</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => demoLogin("professor")} disabled={loading}
              style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #a22237, #5C1E26)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer" }}>
              Enter as Professor
            </button>
            <button type="button" onClick={() => demoLogin("student")} disabled={loading}
              style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: "1.5px solid #a22237", background: "#fff", color: "#a22237", fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer" }}>
              Enter as Student
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 8, textAlign: "center" }}>Loads a seeded CHEM 1301 class — no signup required</div>
          {status && (
            <div style={{ marginTop: 10, padding: "9px 12px", backgroundColor: "rgba(66,133,244,0.07)", border: "1px solid rgba(66,133,244,0.25)", borderRadius: 8, fontSize: 12, color: "#2b5fb3", textAlign: "center" }}>
              ⏳ {status}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", backgroundColor: "#fff0f2", border: "1px solid #f9a8b4", borderRadius: 8, fontSize: 13, color: "#a22237", marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKey}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKey}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", outline: "none" }}
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "11px", backgroundColor: loading ? "#9b3347" : "#5C1E26", borderRadius: 10,
            color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 600, marginBottom: 20,
          }}
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <div style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginBottom: 20 }}>── or ──</div>

        <button
          onClick={() => alert("Google sign-in coming soon!")}
          style={{
            width: "100%", padding: "10px", backgroundColor: "#f5f5f5", fontSize: 14, color: "#333",
            borderRadius: 10, border: "1px solid #ddd", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 500,
          }}
        >
          <img src="/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
          Log in with Google
        </button>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#888" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#a22237", textDecoration: "none", fontWeight: 600 }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
