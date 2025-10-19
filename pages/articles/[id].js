// pages/articles/[id].js
export async function getServerSideProps(ctx) {
  const { id } = ctx.query;

  // Optional extra guard (middleware should handle this already)
  const cookie = ctx.req.cookies?.fff_granted;
  if (!cookie) {
    return {
      redirect: { destination: "/articles", permanent: false },
    };
  }

  const token  = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_NAME; // e.g. "Articles"

  if (!token || !baseId || !table) {
    return { notFound: true };
  }

  // Fetch the single record
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    table
  )}/${encodeURIComponent(id)}`;

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (r.status === 404) return { notFound: true };
  if (!r.ok) {
    return {
      props: {
        error: `Airtable error: ${r.status}`,
        rec: null,
      },
    };
  }

  const j = await r.json();

  // Map fields defensively
  const f = j.fields || {};
  const rec = {
    id: j.id,
    title: f.Title || "",
    abstract: f.Abstract || "",
    citation: f["Full Citation"] || f.Citation || "",
    summary1: f["FFF Summary 1"] || "",
    summary2: f["FFF Summary 2"] || "",
    cluster: f.Cluster || f.Clusters || "",
    date: f.Date || "",
  };

  return { props: { rec, error: null } };
}

export default function ArticlePage({ rec, error }) {
  if (error) {
    return (
      <main style={styles.wrap}>
        <h1 style={styles.h1}>Research Article</h1>
        <p style={styles.err}>{error}</p>
      </main>
    );
  }
  if (!rec) {
    return (
      <main style={styles.wrap}>
        <h1 style={styles.h1}>Not found</h1>
        <p>This record doesn’t exist.</p>
      </main>
    );
  }

  return (
    <main style={styles.wrap}>
      <a href="/articles" style={styles.back}>&larr; Back to archive</a>
      <h1 style={styles.h1}>{rec.title || "Untitled"}</h1>
      <div style={styles.meta}>
        {rec.cluster ? <span>{rec.cluster}</span> : null}
        {rec.date ? <span> · {rec.date}</span> : null}
      </div>

      {rec.summary1 ? (
        <>
          <h2 style={styles.h2}>FFF Summary 1</h2>
          <p style={styles.p}>{rec.summary1}</p>
        </>
      ) : null}

      {rec.summary2 ? (
        <>
          <h2 style={styles.h2}>FFF Summary 2</h2>
          <p style={styles.p}>{rec.summary2}</p>
        </>
      ) : null}

      {rec.abstract ? (
        <>
          <h2 style={styles.h2}>Article Abstract</h2>
          <p style={styles.p}>{rec.abstract}</p>
        </>
      ) : null}

      {rec.citation ? (
        <>
          <h2 style={styles.h2}>Full Citation</h2>
          <p style={{ ...styles.p, opacity: 0.85 }}>{rec.citation}</p>
        </>
      ) : null}
    </main>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    padding: "2rem 1rem",
    maxWidth: 900,
    margin: "0 auto",
    color: "#fff",
    background: "#0b0b0f",
  },
  back: { color: "#a5b4fc", textDecoration: "underline" },
  h1: { margin: "0.5rem 0 0.75rem 0" },
  h2: { marginTop: "1.75rem", marginBottom: "0.5rem" },
  p: { lineHeight: 1.7 },
  meta: { opacity: 0.75, marginBottom: 20 },
  err: { color: "#fca5a5" },
};
