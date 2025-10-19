// pages/articles/[id].js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { isSaved, toggleSave } from "../../lib/readingList";

export default function ArticleDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [item, setItem] = useState(null);
  const [saved, setSaved] = useState(false);

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

  // ---------- export helpers ----------
  function download(filename, content, mime = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a);
    a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  const q = (v = "") =>
    `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

  function toCSV(a) {
    const headers = [
      "RecordID","Title","Cluster","Date","Abstract",
      "FFF Summary 1","FFF Summary 2","FFF Summary 3","FFF Summary 4","Full citation",
    ].join(",");
    const row = [
      q(a.id), q(a.title), q(a.cluster), q(a.date), q(a.abstract),
      q(a.s1), q(a.s2), q(a.s3), q(a.s4), q(a.citation)
    ].join(",");
    return headers + "\n" + row + "\n";
  }
  const slugify = (s="") => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40);
  const yearFromDate = (d) => { try { const y = new Date(d).getFullYear(); return Number.isFinite(y)?y:""; } catch { return ""; } };
  function toBibTeX(a) {
    const key = (slugify(a.title) || "fff-article") + (yearFromDate(a.date) ? `-${yearFromDate(a.date)}` : "");
    return [
      `@misc{${key || `fff-${a.id}`},`,
      a.title ? `  title = {${a.title}},` : null,
      yearFromDate(a.date) ? `  year = {${yearFromDate(a.date)}},` : null,
      a.cluster ? `  note = {Cluster: ${a.cluster}},` : null,
      a.abstract ? `  howpublished = {Abstract available},` : null,
      `  publisher = {FFF Research Archive}`,
      `}`,
    ].filter(Boolean).join("\n") + "\n";
  }
  // ---------- end helpers ----------

  return (
    <main className="article-shell">
      <div className="article-wrap">
        <div className="article-top">
          <Link href="/articles" className="back-link">← Back to archive</Link>
        </div>

        {loading && <div>Loading…</div>}
        {err && <div className="error">{err}</div>}

        {item && !loading && !err && (
          <>
            <h1 className="article-title">{item.title || "Untitled"}</h1>
            <div className="article-meta">
              {item.cluster ? item.cluster : null}
              {item.date ? (item.cluster ? ` · ${item.date}` : item.date) : ""}
            </div>

            <div className="action-row">
              <button className={`btn ${saved ? "secondary" : ""}`} onClick={onSave}>
                {saved ? "Saved ✓" : "Save to reading list"}
              </button>
              <div className="spacer" />
              <button className="btn ghost"
                onClick={() => download(`fff-${item.id}.bib`, toBibTeX(item), "text/x-bibtex;charset=utf-8")}>
                Export BibTeX
              </button>
              <button className="btn ghost"
                onClick={() => download(`fff-${item.id}.csv`, toCSV(item), "text/csv;charset=utf-8")}>
                Export CSV
              </button>
            </div>

            {item.abstract && (
              <Section title="Abstract"><div className="pre-wrap">{item.abstract}</div></Section>
            )}
            {item.s1 && (<Section title="FFF Summary 1"><div className="pre-wrap">{item.s1}</div></Section>)}
            {item.s2 && (<Section title="FFF Summary 2"><div className="pre-wrap">{item.s2}</div></Section>)}
            {item.s3 && (<Section title="FFF Summary 3"><div className="pre-wrap">{item.s3}</div></Section>)}
            {item.s4 && (<Section title="FFF Summary 4"><div className="pre-wrap">{item.s4}</div></Section>)}
            {item.citation && (
              <Section title="Full citation"><div className="pre-wrap">{item.citation}</div></Section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="article-sec">
      <h3 className="article-sec-title">{title}</h3>
      <div className="article-sec-body">{children}</div>
    </section>
  );
}
