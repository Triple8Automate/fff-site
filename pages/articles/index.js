// pages/articles/index.js
import { useEffect, useRef, useState } from "react";

export async function getServerSideProps() {
  return { props: {} };
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
  const [clusters, setClusters] = useState([]);

  const debounceRef = useRef(null);

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

  // load clusters after gate
  useEffect(() => {
    if (!granted) return;
    (async () => {
      try {
        const r = await fetch("/api/clusters");
        const j = await r.json();
        if (r.ok && Array.isArray(j.clusters)) setClusters(j.clusters);
      } catch {}
    })();
  }, [granted]);

  // fetch list (debounced)
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

  // Email Gate
  if (!granted) {
    return (
      <main className="gate-container">
        <h1>Access the Forbidden Archive</h1>
        <p>
          1,200+ peer-reviewed studies distilled into practical protocols. Enter
          your email to unlock the research archive.
        </p>
        <form onSubmit={handleSubmit} className="gate-form">
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
            className="gate-input"
          />
          <button type="submit" disabled={loadingSub} className="gate-submit">
            {loadingSub ? "Unlocking…" : "Unlock Archive"}
          </button>
        </form>
        {subErr && <div className="error-state">{subErr}</div>}
        <div className="gate-disclaimer">
          We'll occasionally send research highlights. Unsubscribe anytime.
        </div>
      </main>
    );
  }

  // Archive List
  return (
    <main className="archive-container">
      <div className="archive-header">
        <h1>Research Archive</h1>
        <p>Welcome{email ? `, ${email}` : ""}. Browse 1,200+ peer-reviewed studies.</p>
      </div>

      {/* Search + Cluster Filter */}
      <div className="controls">
        <input
          type="search"
          placeholder="Search title, abstract, citation…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="search-input"
        />
        <select
          value={cluster}
          onChange={(e) => setCluster(e.target.value)}
          className="filter-select"
        >
          <option value="">All clusters</option>
          {(clusters || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {listErr && <div className="error-state">{listErr}</div>}

      {/* Loading State */}
      {loadingList && items.length === 0 && (
        <div className="loading-state">Loading articles...</div>
      )}

      {/* Empty State */}
      {!loadingList && items.length === 0 && !listErr && (
        <div className="empty-state">No articles found. Try adjusting your search.</div>
      )}

      {/* Article List */}
      {items.length > 0 && (
        <ul className="article-list">
          {items.map((a) => (
            <li key={a.id} className="article-item">
              <a href={`/articles/${a.id}`} className="article-link">
                {a.title || "Untitled"}
              </a>

              <div className="article-meta">
                {a.date ? `${a.date}` : ""}
                {a.cluster ? ` · ${a.cluster}` : ""}
              </div>

              {/* Show ALL summaries (truncated) if present */}
              {(a.summaries || []).length > 0 && (
                <div className="article-summary">
                  {(a.summaries || []).map((s, i) => (
                    <div key={i} className="summary-item">
                      <span className="summary-label">Summary {i + 1}:</span>{" "}
                      {s.length > 220 ? s.slice(0, 220) + "…" : s}
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback to abstract preview if no summaries */}
              {!a.summaries?.length && a.abstract && (
                <div className="article-summary">
                  {a.abstract.length > 220
                    ? a.abstract.slice(0, 220) + "…"
                    : a.abstract}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Load More */}
      {cursor && (
        <div className="load-more">
          <button
            onClick={loadMore}
            disabled={loadingList}
            className="load-more-btn"
          >
            {loadingList ? "Loading…" : "Load more articles"}
          </button>
        </div>
      )}
    </main>
  );
}

