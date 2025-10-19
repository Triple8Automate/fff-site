// pages/api/archive.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // --- ENV & defaults
    const token  = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_ARTICLES_TABLE || "Articles";
    const view   = process.env.AIRTABLE_ARTICLES_VIEW || ""; // optional

    // Field names (match your base EXACTLY or override via env)
    const F_TITLE    = process.env.AIRTABLE_ARTICLES_TITLE_FIELD    || "Title";
    const F_ABS      = process.env.AIRTABLE_ARTICLES_ABSTRACT_FIELD || "Article Abstract";
    const F_CIT      = process.env.AIRTABLE_ARTICLES_CITATION_FIELD || "Full Citation";
    const F_URL      = process.env.AIRTABLE_ARTICLES_URL_FIELD      || "URL";
    const F_SLUG     = process.env.AIRTABLE_ARTICLES_SLUG_FIELD     || "slug";
    const F_DATE     = process.env.AIRTABLE_ARTICLES_DATE_FIELD     || "date";
    const F_TOPIC    = process.env.AIRTABLE_ARTICLES_TOPIC_FIELD    || "Topic";
    const F_CLUSTER  = process.env.AIRTABLE_ARTICLES_CLUSTER_FIELD  || "Cluster";

    if (!token || !baseId || !table) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    // --- Query params
    const { q = "", cluster = "", cursor = "", limit = "50" } = req.query;
    const pageSize = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 50));

    // --- Helpers
    const esc = (s = "") =>
      String(s).replace(/'/g, "\\'"); // escape single-quotes for formula

    // Build filter only if needed (422 often happens from bad/empty formulas or bad field names)
    const parts = [];

    if (q) {
      // Case-insensitive search across title/abstract/citation
      const ql = esc(q.toLowerCase());
      // LOWER() and FIND() are supported; wrap each field in LOWER() then FIND
      const orFields = [];
      orFields.push(`FIND('${ql}', LOWER({${F_TITLE}}))`);
      orFields.push(`FIND('${ql}', LOWER({${F_ABS}}))`);
      orFields.push(`FIND('${ql}', LOWER({${F_CIT}}))`);
      parts.push(`OR(${orFields.join(",")})`);
    }

    if (cluster) {
      parts.push(`{${F_CLUSTER}} = '${esc(cluster)}'`);
    }

    const filterByFormula = parts.length ? `AND(${parts.join(",")})` : "";

    // --- Build URL
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
    url.searchParams.set("pageSize", String(pageSize));
    if (cursor) url.searchParams.set("offset", String(cursor));
    if (filterByFormula) url.searchParams.set("filterByFormula", filterByFormula);
    if (view) url.searchParams.set("view", view);

    // --- Fetch
    const r = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    if (!r.ok) {
      // Surface Airtable’s own error object so we can see the exact complaint
      return res.status(r.status).json({ error: "Airtable error", status: r.status, detail: data });
    }

    // --- Map records
    const items = (data.records || []).map((rec) => {
      const f = rec.fields || {};
      return {
        id: rec.id,
        title: f[F_TITLE] ?? "",
        abstract: f[F_ABS] ?? "",
        citation: f[F_CIT] ?? "",
        url: f[F_URL] ?? "",
        slug: f[F_SLUG] ?? "",
        date: f[F_DATE] ?? "",
        topic: f[F_TOPIC] ?? "",
        cluster: f[F_CLUSTER] ?? "",
      };
    });

    return res.status(200).json({
      items,
      nextCursor: data.offset || null,
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e).slice(0, 800) });
  }
}
