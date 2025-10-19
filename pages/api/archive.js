// pages/api/archive.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token  = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_ARTICLES_TABLE || "Articles";
    const view   = process.env.AIRTABLE_ARTICLES_VIEW || ""; // optional

    // Match these to your Airtable column names (override via env if different)
    const F_TITLE    = process.env.AIRTABLE_ARTICLES_TITLE_FIELD    || "Title";
    const F_ABS      = process.env.AIRTABLE_ARTICLES_ABSTRACT_FIELD || "Article Abstract";
    const F_CIT      = process.env.AIRTABLE_ARTICLES_CITATION_FIELD || "Full Citation";
    const F_SLUG     = process.env.AIRTABLE_ARTICLES_SLUG_FIELD     || "slug";
    const F_DATE     = process.env.AIRTABLE_ARTICLES_DATE_FIELD     || "date";
    const F_TOPIC    = process.env.AIRTABLE_ARTICLES_TOPIC_FIELD    || "Topic";
    const F_CLUSTER  = process.env.AIRTABLE_ARTICLES_CLUSTER_FIELD  || "Cluster";

    if (!token || !baseId || !table) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    const { q = "", cluster = "", cursor = "", limit = "50" } = req.query;
    const pageSize = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 50));

    const esc = (s = "") => String(s).replace(/'/g, "\\'");

    // Build filter formula only when needed
    const parts = [];
    if (q) {
      const ql = esc(q.toLowerCase());
      const orFields = [
        `FIND('${ql}', LOWER({${F_TITLE}}))`,
        `FIND('${ql}', LOWER({${F_ABS}}))`,
        `FIND('${ql}', LOWER({${F_CIT}}))`,
      ];
      parts.push(`OR(${orFields.join(",")})`);
    }
    if (cluster) parts.push(`{${F_CLUSTER}} = '${esc(cluster)}'`);
    const filterByFormula = parts.length ? `AND(${parts.join(",")})` : "";

    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
    url.searchParams.set("pageSize", String(pageSize));
    if (cursor) url.searchParams.set("offset", String(cursor));
    if (filterByFormula) url.searchParams.set("filterByFormula", filterByFormula);
    if (view) url.searchParams.set("view", view);

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
      return res.status(r.status).json({ error: "Airtable error", status: r.status, detail: data });
    }

    const items = (data.records || []).map((rec) => {
      const f = rec.fields || {};
      return {
        id: rec.id,
        title: f[F_TITLE] ?? "",
        abstract: f[F_ABS] ?? "",
        citation: f[F_CIT] ?? "",
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
