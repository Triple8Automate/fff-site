// pages/articles/index.js
import { useEffect, useMemo, useState } from "react";

function getUTMSource() {
  if (typeof window === "undefined") return "archive-gate";
  const u = new URL(window.location.href);
  const utm = u.searchParams.get("utm_source");
  const camp = u.searchParams.get("utm_campaign");
  const src = [];
  if (utm) src.push(`utm:${utm}`);
  if (camp) src.push(`cmp:${camp}`);
  return src.length ? src.join("|") : "archive-gate";
}

export default function ArticlesGate() {
  const [email, setEmail] = useState("");
  const [granted, setGranted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // archive list state
  const [items, setItems] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveErr, setArchiveErr] = useState("");

  // basic client-only check for existing access
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fffEmail");
      if (saved) {
        setGranted(true);
        setEmail(saved);
      }
    } catch {}
    setChecked(true);
  }, []);

  // fetch the archive after we have access
  useEffect(() => {
    if (!granted) return;
    let ignore = false;

    (async () => {
      setLoadingArchive(true);
      setArchiveErr("");
      try {
        const r = await fetch("/api/archive");
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load archive");
        if (!ignore) setItems(j.items || []);
      } catch (e) {
        if (!ignore) setArchiveErr(e.message || "Could not load archive.");
      } finally {
        if (!ignore) setLoadingArchive(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [granted]);

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
      const source = getUTMSource();
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Subscribe failed");

      // Persist for UX; the gate itself is enforced by HttpOnly cookie set by API
      window.localStorage.setItem("fffEmail", email);
      setGranted(true);
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // ──────────────────────
  // Gated view (before unlock)
  // ──────────────────────
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
        <p style={{ maxWidth: 520, opacity: 0.8 }}>
          1,200+ peer-reviewed studies distilled into practical protocols. Enter
          your email to unlock the research archive.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ marginTop: "1.5rem", opacity: checked ? 1 : 0.6 }}
        >
          {/* Honeypot to deter bots */}
          <input
            type="text"
            name="company"
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

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
              width: 280,
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

  // ──────────────────────
  // Unlocked view (archive list)
  // ──────────────────────
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "3rem 1.25rem",
        color: "#fff",
        background: "#0b0b0f",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>Research Archive</h1>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>
          Welcome{email ? `, ${email}` : ""}. {loadingArchive && "Loading…"}
        </p>

        {archiveErr && (
          <div style={{ color: "#fca5a5", marginBottom: 16 }}>{archiveErr}</div>
        )}

        {!archiveErr && items.length === 0 && !loadingArchive && (
          <p>No articles yet. Check back soon.</p>
        )}

        <ul style={{ lineHeight: 1.9, paddingLeft: 0, listStyle: "none" }}>
          {items.map((a) => (
            <li key={a.id} style={{ marginBottom: 4 }}>
              <a
                href={`/articles/${a.slug}`}
                style={{ textDecoration: "underline", color: "#a5b4fc" }}
              >
                {a.title || a.slug}
              </a>
              <span style={{ opacity: 0.65 }}>
                {a.date ? ` — ${a.date}` : ""} {a.topic ? `· ${a.topic}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
