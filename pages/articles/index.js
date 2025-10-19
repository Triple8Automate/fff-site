import { useEffect, useState } from "react";

export default function ArticlesGate() {
  const [email, setEmail] = useState("");
  const [granted, setGranted] = useState(false);
  const [checked, setChecked] = useState(false); // becomes true after we check localStorage
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    // runs only in the browser, not during build/SSR
    try {
      const saved = window.localStorage.getItem("fffEmail");
      if (saved) {
        setGranted(true);
        setEmail(saved);
      }
    } catch {}
    setChecked(true);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    const ok = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) {
      setErr("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "archive-gate" }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Subscribe failed");
      window.localStorage.setItem("fffEmail", email);
      setGranted(true);
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // While building / first paint on server, `checked` is false -> show gate (safe for SSR)
  if (!granted) {
    return (
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
          background: "#000",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <h1>Access the Forbidden Archive</h1>
        <p style={{ maxWidth: 480, opacity: 0.8 }}>
          1,200+ peer-reviewed studies distilled into practical protocols.
          Enter your email to unlock the research archive.
        </p>

        {/* Only enable the form after we've checked localStorage (avoids hydration mismatch) */}
        <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem", opacity: checked ? 1 : 0.6 }}>
          {/* Honeypot to deter bots */}
          <input type="text" name="company" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!checked}
            style={{
              padding: "0.8rem 1rem",
              borderRadius: 6,
              border: "1px solid #333",
              width: 260,
              marginRight: 8,
              background: "#111",
              color: "#fff",
            }}
          />
          <button
            type="submit"
            disabled={loading || !checked}
            style={{
              background: "linear-gradient(90deg,#a855f7,#3b82f6)",
              border: "none",
              padding: "0.8rem 1.2rem",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              opacity: loading || !checked ? 0.7 : 1,
            }}
          >
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </form>

        {err && <div style={{ color: "#fca5a5", marginTop: 10 }}>{err}</div>}
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 12 }}>
          We’ll occasionally send research highlights. Unsubscribe anytime.
        </div>
      </main>
    );
  }

  // Unlocked view
  return (
    <main style={{ minHeight: "100vh", padding: "3rem", color: "#fff", background: "#0b0b0f" }}>
      <h1>Research Archive</h1>
      <p>Welcome{email ? `, ${email}` : ""}.</p>
      <p>The full index of articles will load here soon.</p>
    </main>
  );
}
