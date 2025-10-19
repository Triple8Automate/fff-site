// pages/articles/[id].js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getReadingList, isSaved, toggleSave } from "../../lib/readingList";

export async function getServerSideProps() {
  return { props: {} };
}

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
        try {
          setSaved(isSaved(j.id));
        } catch {}
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

  if (loading) {
    return (
      <main className="article-wrap">
        <div className="loading">Loading article...</div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="article-wrap">
        <div className="breadcrumb">
          <Link href="/articles">← Back to archive</Link>
        </div>
        <div className="error">{err}</div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="article-wrap">
        <div className="breadcrumb">
          <Link href="/articles">← Back to archive</Link>
        </div>
        <div className="error">Article not found</div>
      </main>
    );
  }

  return (
    <main className="article-wrap">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <Link href="/articles">← Back to archive</Link>
        <Link href="/reading-list">Reading list</Link>
      </div>

      {/* Article Title */}
      <h1>{item.title || "Untitled"}</h1>

      {/* Meta Information */}
      <div className="meta">
        {item.cluster && <span className="badge">{item.cluster}</span>}
        {item.date && <span>{item.date}</span>}
      </div>

      {/* Action Buttons */}
      <div className="actions">
        <button onClick={onSave} className={saved ? "btn secondary" : "btn"}>
          {saved ? "✓ Saved to reading list" : "Save to reading list"}
        </button>
      </div>

      {/* Abstract */}
      {item.abstract && (
        <Section title="Abstract">
          <div className="content-text">{item.abstract}</div>
        </Section>
      )}

      {/* FFF Summaries 1–4 */}
      {item.s1 && (
        <Section title="FFF Summary 1">
          <div className="content-text">{item.s1}</div>
        </Section>
      )}

      {item.s2 && (
        <Section title="FFF Summary 2">
          <div className="content-text">{item.s2}</div>
        </Section>
      )}

      {item.s3 && (
        <Section title="FFF Summary 3">
          <div className="content-text">{item.s3}</div>
        </Section>
      )}

      {item.s4 && (
        <Section title="FFF Summary 4">
          <div className="content-text">{item.s4}</div>
        </Section>
      )}

      {/* Full Citation */}
      {item.citation && (
        <Section title="Full Citation">
          <div className="content-text small">{item.citation}</div>
        </Section>
      )}

      {/* Separator before footer */}
      <hr className="sep" />

      {/* Footer Navigation */}
      <div className="breadcrumb">
        <Link href="/articles">← Back to archive</Link>
        <Link href="/reading-list">View reading list</Link>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="section">
      <h3>{title}</h3>
      <div className="panel">{children}</div>
    </section>
  );
}

