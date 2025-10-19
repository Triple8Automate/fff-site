// pages/articles/[id].js
export async function getServerSideProps({ params, req }) {
  const cookies = req.headers.cookie || "";
  if (!cookies.includes("fff_granted=1")) {
    return { redirect: { destination: "/articles", permanent: false } };
  }

  const token  = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_NAME || "Articles";
  if (!token || !baseId || !table) return { notFound: true };

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${encodeURIComponent(params.id)}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 404) return { notFound: true };
    if (!r.ok) throw new Error();

    const rec = await r.json();
    const f = rec.fields || {};

    const summaries = [];
    for (let i = 1; i <= 20; i++) {
      const v = f[`FFF Summary ${i}`];
      if (v && String(v).trim()) summaries.push(String(v));
    }

    const article = {
      id: rec.id,
      title: f.Title || "",
      summaries,
      abstract: f["Article Abstract"] || f.Abstract || "",
      citation: f["Full Citation"] || f.Citation || "",
      cluster: f.Cluster || f.cluster || "",
      date: f.Date || f.Published || "",
    };

    return { props: { article } };
  } catch {
    return { notFound: true };
  }
}

export default function ArticlePage({ article }) {
  if (!article) return null;
  return (
    <main style={{ minHeight: "100vh", padding: "2rem 1rem", color: "#fff", background: "#0b0b0f" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <a href="/articles" style={{ color: "#a5b4fc" }}>← Back to archive</a>
        <h1 style={{ margin: "12px 0 6px" }}>{article.title || "Untitled"}</h1>
        <div style={{ opacity: 0.7, marginBottom: 16 }}>
          {article.date ? `Published: ${article.date}` : ""}{article.cluster ? ` · ${article.cluster}` : ""}
        </div>

        {(article.summaries || []).length > 0 && (
          <>
            <h2 style={{ marginTop: 24 }}>FFF Summaries</h2>
            {(article.summaries || []).map((s, i) => (
              <p key={i} style={{ opacity: 0.95, lineHeight: 1.7 }}>
                <strong>Summary {i + 1}:</strong> {s}
              </p>
            ))}
          </>
        )}

        {article.abstract && (
          <>
            <h3 style={{ marginTop: 24 }}>Abstract</h3>
            <p style={{ opacity: 0.9, lineHeight: 1.7 }}>{article.abstract}</p>
          </>
        )}

        {article.citation && (
          <>
            <h3 style={{ marginTop: 24 }}>Full citation</h3>
            <pre style={{ whiteSpace: "pre-wrap", opacity: 0.85 }}>{article.citation}</pre>
          </>
        )}
      </div>
    </main>
  );
}
