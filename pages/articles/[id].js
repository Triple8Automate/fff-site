// pages/articles/[id].js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
// pages/articles/[id].js  (and keep your existing logic)
import "../../styles/article.css";


export default function ArticleDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [item, setItem] = useState(null);

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
      } catch (e) {
        setErr(e.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <main style={{ minHeight: "100vh", padding: "2rem 1rem", color: "#fff", background: "#0b0b0f" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/articles" style={{ color: "#a5b4fc", textDecoration: "underline" }}>
            ← Back to archive
          </Link>
        </div>

        {loading && <div>Loading…</div>}
        {err && <div style={{ color: "#fca5a5" }}>{err}</div>}

        {item && !loading && !err && (
          <>
            {/* Title */}
            <h1 style={{ marginBottom: 8 }}>{item.title || "Untitled"}</h1>

            {/* Cluster / meta line */}
            <div style={{ opacity: 0.75, marginBottom: 20 }}>
              {item.cluster ? item.cluster : null}
              {item.date ? (item.cluster ? ` · ${item.date}` : item.date) : ""}
            </div>

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
