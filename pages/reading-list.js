// pages/reading-list.js
import Link from "next/link";
import { useEffect, useState } from "react";
import { getReadingList, toggleSave } from "../lib/readingList";

export default function ReadingList() {
  const [items, setItems] = useState([]);

  useEffect(() => { try { setItems(getReadingList()); } catch {} }, []);

  function remove(id) {
    const nowSaved = toggleSave({ id });
    // if toggleSave returns true it re-added; we want removal so force refresh from storage
    try { setItems(getReadingList()); } catch {}
  }

  return (
    <main className="article-shell">
      <div className="article-wrap">
        <div className="article-top">
          <Link href="/articles" className="back-link">← Back to archive</Link>
        </div>
        <h1 className="article-title">Reading list</h1>

        {items.length === 0 && <div>No saved articles yet.</div>}

        <ul style={{ listStyle: "none", paddingLeft: 0, lineHeight: 1.9 }}>
          {items.map((a) => (
            <li key={a.id} style={{ marginBottom: 8 }}>
              <Link href={`/articles/${a.id}`} className="link">
                {a.title || "Untitled"}
              </Link>
              <span style={{ opacity: 0.65 }}>
                {a.date ? ` — ${a.date}` : ""} {a.cluster ? `· ${a.cluster}` : ""}
              </span>
              <button className="btn ghost" style={{ marginLeft: 12 }} onClick={() => remove(a.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
