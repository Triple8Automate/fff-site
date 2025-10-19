// pages/articles/[id].js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getReadingList, isSaved, toggleSave } from "../../lib/readingList";

export default function ArticleDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [item, setItem] = useState(null);
  const [saved, setSaved] = useState(false);

  // fetch the article
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`/api/article?id=${encodeURIComponent(id)}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load");
        setItem(j);
        try { setSaved(isSaved(j.id)); } catch {}
      } catch (e) {
        setErr(e.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function onSave() {
    if (!item) return;
    const now = toggleSave({
      id: item.id,
      title: item.title,
      cluster: item.cluster,
      date: item.date,
    });
    setSaved(now);
  }

  return (
    <main style={{ minHeight: "100vh", padding: "2rem 1rem", color: "#fff", background: "#0b0b0f" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/articles" style={{ color: "#a5b4fc", textDecoration: "underline" }}>
            ← Back to archive
          </Link>
          <Link href="/reading-list" style={{ color: "#a5b4fc", textDecoration: "underline" }}>
            Reading list
          </Link>
        </div>

        {loading && <div>Loading…</div>}
        {err && <div style={{ color: "#fca5a5" }}>{err}</div>}

        {item && !loading && !err && (
          <>
            {/* Title */}
            <h1 style={{ marginBottom: 8 }}>{item.title || "Untitled"}</h1>

            {/* Meta */}
            <div style={{ opacity: 0.75, marginBottom: 16 }}>
              {item.cluster ? item.cluster : null}
              {item.date ? (item.cluster ? ` · ${item.date}` : item.date) : ""}
            </div>

            {/* Save button */}
            <button
              onClick={onSave}
              style={{
                marginBottom: 20,
                background: saved ? "#1f2937" : "linear-gradient(90deg,#a855f7,#3b82f6)",
                border: "none",
                padding: "0.6rem 0.95rem",
                borderRadius: 8,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {saved ? "Saved ✓" : "Save to reading list"}
            </button>

            {/* Abstract */}
            {item.abstract && (
              <Section title="Abstract">
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{item.abstract}</div>
              </Section>
            )}

            {/* FFF Summaries 1–4 */}
            {item.s1 && (
              <Section title="FFF Summary 1">
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{item.s1}</div>
              </Section>
            )}
            {item.s2 && (
              <Section title="FFF Summary 2">
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{item.s2}</div>
              </Section>
            )}
            {item.s3 && (
              <Section title="FFF Summary 3">
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{item.s3}</div>
              </Section>
            )}
            {item.s4 && (
              <Section title="FFF Summary 4">
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{item.s4}</div>
              </Section>
            )}

            {/* Full citation */}
            {item.citation && (
              <Section title="Full citation">
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{item.citation}</div>
              </Section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ margin: "22px 0" }}>
      <h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>{title}</h3>
      <div style={{ opacity: 0.95 }}>{children}</div>
    </section>
  );
}
