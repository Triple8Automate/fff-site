// pages/articles/[id].js
import Head from "next/head";

export async function getServerSideProps(ctx) {
  const { id } = ctx.params || {};
  if (!id) return { notFound: true };

  const baseId  = process.env.AIRTABLE_BASE_ID;
  const table   = process.env.AIRTABLE_ARTICLES_TABLE || process.env.AIRTABLE_TABLE_NAME || "Articles";
  const token   = process.env.AIRTABLE_TOKEN;

  try {
    const r = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await r.json();
    if (!r.ok) {
      return { notFound: true };
    }

    const f = data.fields || {};
    return {
      props: {
        id: data.id,
        title: f.Title || "",
        abstract: f.Abstract || "",
        citation: f.Citation || f["Full Citation"] || "",
        notes: f.Notes || "",
        cluster: f.cluster || f.Cluster || "",
        date: f.Date || "",
      },
    };
  } catch {
    return { notFound: true };
  }
}

export default function ArticleView({ id, title, abstract, citation, notes, cluster, date }) {
  return (
    <main style={{ minHeight: "100vh", padding: "2rem 1rem", color: "#fff", background: "#0b0b0f" }}>
      <Head><title>{title ? `${title} – Research` : "Research Article"}</title></Head>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <a href="/articles" style={{ color: "#a5b4fc" }}>← Back to archive</a>
        <h1 style={{ marginTop: 10 }}>{title || "Untitled"}</h1>
        <div style={{ opacity: 0.7, marginBottom: 12 }}>
          {date ? `Published: ${date}` : ""} {cluster ? (date ? " · " : "") + cluster : ""}
          <span style={{ opacity: 0.5 }}> — {id}</span>
        </div>

        {abstract ? (
          <>
            <h3>Abstract</h3>
            <p style={{ lineHeight: 1.7, opacity: 0.95 }}>{abstract}</p>
          </>
        ) : null}

        {citation ? (
          <>
            <h3 style={{ marginTop: 24 }}>Full citation</h3>
            <p style={{ lineHeight: 1.7, opacity: 0.85 }}>{citation}</p>
          </>
        ) : null}

        {notes ? (
          <>
            <h3 style={{ marginTop: 24 }}>Notes</h3>
            <p style={{ lineHeight: 1.7, opacity: 0.85 }}>{notes}</p>
          </>
        ) : null}
      </div>
    </main>
  );
}
