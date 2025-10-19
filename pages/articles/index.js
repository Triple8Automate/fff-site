// pages/articles/index.js
import { useEffect, useRef, useState } from "react";

const CLUSTERS = [
  "Hormonal",
  "Neurology",
  "Psychology",
  "Sexuality",
  "Performance",
  "Nutrition",
  "Training",
  "Sleep",
  "Longevity",
  "Recovery",
];

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
  const [loadingSub, setLoadingSub] = useState(false);
  const [subErr, setSubErr] = useState("");

  // Archive state
  const [q, setQ] = useState("");
  const [cluster, setCluster] = useState("");
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [listErr, setListErr] = useState("");
  const debounceRef = useRef(null);

  // Check if already unlocked
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

  // Fetch first page whenever filters change (debounced)
  useEffect(() => {
    if (!granted) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      (async () => {
        setLoadingList(true);
        setListErr("");
        try {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (cluster) params.set("cluster", cluster);
          params.set("limit", "50");

          const r = await fetch(`/api/archive?${params.toString()}`);
          const j = await r.json();
          if (!r.ok) throw new Error(j?.error || "Failed to load archive.");
          setItems(j.items || []);
          setCursor(j.nextCursor || null);
        } catch (e) {
          setListErr(e.message || "Could not load archive.");
          setItems([]);
          setCursor(null);
        } finally {
          setLoadingList(false);
        }
      })();
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [granted, q, cluster]);

  async function loadMore() {
    if (!cursor) return;
    try {
      setLoadingList(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (cluster) params.set("cluster", cluster);
      params.set("cursor", cursor);
      params.set("limit", "50");

      const r = await fetch(`/api/archive?${params.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load archive.");
      setItems((prev) => [...prev, ...(j.items || [])]);
      setCursor(j.nextCursor || null);
    } catch (e) {
      setListErr(e.message || "Could not load more.");
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubErr("");

    const ok = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) {
      setSubErr("Please enter a valid email.");
      return;
    }

    setLoadingSub(true);
    try {
      const source = getUTMSource();
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Subscribe failed");
      window.localStorage.setItem("fffEmail", email);
      setGranted(true);
    } catch (e) {
      setSubErr(e.message || "Something went wrong.");
    } finally {
      setLoadingSub(false);
    }
  }

  // ──────────────────────
  // Gate (before unlock)
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
        <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
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
            disabled={loadingSub}
            style={{
              background: "linear-gradient(90deg,#a855f7,#3b82f6)",
              border: "none",
              padding: "0.8rem 1.2rem",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              opacity: loadingSub ? 0.7 : 1,
            }}
          >
            {loadingSub ? "Unlocking…" : "Unlock"}
          </button>
        </form>
        {subErr && (
          <div style={{ color: "#fca5a5", marginTop: 10 }}>{subErr}</div>
        )}
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 12 }}>
          We’ll occasionally send research highlights. Unsubscribe anytime.
        </div>
      </main>
    );
  }

  // ──────────────────────
  // Unlocked view (list)
  // ──────────────────────
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "2rem 1rem",
        color: "#fff",
        background: "#0b0b0f",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>Research Archive</h1>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>
          Welcome{email ? `, ${email}` : ""}.
        </p>

        {/* Search + Cluster filter */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 220px",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <input
            type="search"
            placeholder="Search title, abstract, citation…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              padding: "0.7rem 0.9rem",
              borderRadius: 8,
              border: "1px solid #2a2a2a",
              background: "#0f0f14",
              color: "#fff",
            }}
          />
          <select
            value={cluster}
            onChange={(e) => setCluster(e.target.value)}
            style={{
              padding: "0.7rem 0.9rem",
              borderRadius: 8,
              border: "1px solid #2a2a2a",
              background: "#0f0f14",
              color: "#fff",
            }}
          >
            <option value="">All clusters</option>
            {CLUSTERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {listErr && (
          <div style={{ color: "#fca5a5", marginBottom: 16 }}>{listErr}</div>
        )}
        {loadingList && items.length === 0 && <div>Loading…</div>}
        {!loadingList && items.length === 0 && !listErr && <div>No results.</div>}

        <ul style={{ lineHeight: 1.9, paddingLeft: 0, listStyle: "none" }}>
          {items.map((a) => (
            <li key={a.id} style={{ marginBottom: 6 }}>
              {/* Link by RECORD ID (no slugs/URLs needed) */}
              <a
                href={`/articles/${a.id}`}
                style={{ textDecoration: "underline", color: "#a5b4fc" }}
              >
                {a.title || "Untitled"}
              </a>
              <span style={{ opacity: 0.65 }}>
                {a.date ? ` — ${a.date}` : ""} {a.cluster ? `· ${a.cluster}` : ""}
              </span>
              {a.abstract ? (
                <div style={{ opacity: 0.7, fontSize: 13, marginTop: 2, maxWidth: 900 }}>
                  {a.abstract.length > 220
                    ? a.abstract.slice(0, 220) + "…"
                    : a.abstract}
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        {/* Load more */}
        {cursor && (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={loadMore}
              disabled={loadingList}
              style={{
                background: "linear-gradient(90deg,#a855f7,#3b82f6)",
                border: "none",
                padding: "0.7rem 1.1rem",
                borderRadius: 8,
                color: "#fff",
                cursor: "pointer",
                opacity: loadingList ? 0.7 : 1,
              }}
            >
              {loadingList ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
