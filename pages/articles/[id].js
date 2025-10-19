// pages/articles/[id].js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

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
    <main style={{ minHeight:"100vh", padding:"2rem 1rem", color:"#fff", background:"#0b0b0f" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/articles" style={{ color:"#a5b4fc", textDecoration:"underline" }}>← Back to archive</Link>
        </div>

        {loading && <div>Loading…</div>}
        {err && <div style={{ color:"#fca5a5" }}>{err}</div>}

        {item && !loading && !err && (
          <>
            <h1 style={{ marginBottom: 8 }}>{item.title || "Untitled"}</h1>
            <div style={{ opacity:0.7, marginBottom:16 }}>
              {item.date ? item.date : null} {item.cluster ? ` · ${item.cluster}` : ""}
            </div>

            {/* Summaries (show whatever exists, in order) */}
            {[item.s1, item.s2, item.s3, item.s4].filter(Boolean).length > 0 && (
              <section style={{ margin:"20px 0" }}>
                <h3 style={{ marginBottom: 8 }}>Key takeaways</h3>
                <ul style={{ lineHeight:1.7, paddingLeft: "1.1rem" }}>
                  {[item.s1, item.s2, item.s3, item.s4].filter(Boolean).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            )}

            {item.abstract && (
              <section style={{ margin:"20px 0" }}>
                <h3 style={{ marginBottom: 8 }}>Abstract</h3>
                <p style={{ opacity:0.9, lineHeight:1.7 }}>{item.abstract}</p>
              </section>
            )}

            {item.citation && (
              <section style={{ margin:"20px 0" }}>
                <h3 style={{ marginBottom: 8 }}>Full citation</h3>
                <p style={{ opacity:0.9, lineHeight:1.7 }}>{item.citation}</p>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
