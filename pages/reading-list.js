// pages/reading-list.js
import Link from "next/link";
import { useEffect, useState } from "react";
import { getReadingList, removeItem, clearReadingList } from "../lib/readingList";

export default function ReadingList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try { setItems(getReadingList()); } catch {}
  }, []);

  function onRemove(id) {
    removeItem(id);
    setItems(getReadingList());
  }

  function onClear() {
    clearReadingList();
    setItems([]);
  }

  return (
    <main style={{ minHeight: "100vh", padding: "2rem 1rem", color: "#fff", background: "#0b0b0f" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/articles" style={{ color: "#a5b4fc", textDecoration: "underline" }}>
            ← Back to archive
          </Link>
        </div>
        <h1 style={{ marginBottom: 8 }}>Reading list</h1>
        <p style={{ opacity: 0.8, marginBottom: 16 }}>Saved articles on this device.</p>

        {items.length === 0 ? (
          <div>No saved articles yet.</div>
        ) : (
          <>
            <ul style={{ lineHeight: 1.9, paddingLeft: 0, listStyle: "none" }}>
              {items.map((a) => (
                <li key={a.id} style={{ marginBottom: 6, display: "flex", gap: 12, alignItems: "center" }}>
                  <a href={`/articles/${a.id}`} style={{ textDecoration: "underline", color: "#a5b4fc" }}>
                    {a.title}
                  </a>
                  <span style={{ opacity: 0.65 }}>
                    {a.date ? ` — ${a.date}` : ""} {a.cluster ? `· ${a.cluster}` : ""}
                  </span>
                  <button
                    onClick={() => onRemove(a.id)}
                    style={{
                      marginLeft: "auto",
                      background: "#1f2937",
                      border: "none",
                      padding: "0.35rem 0.7rem",
                      borderRadius: 6,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={onClear}
              style={{
                marginTop: 12,
                background: "#111827",
                border: "1px solid #374151",
                padding: "0.5rem 0.9rem",
                borderRadius: 8,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Clear list
            </button>
          </>
        )}
      </div>
    </main>
  );
}
