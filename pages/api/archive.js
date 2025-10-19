// pages/api/archive.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token  = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_ARTICLES_TABLE || process.env.AIRTABLE_TABLE_NAME || "Articles";
  if (!token || !baseId || !table) return res.status(500).json({ error: "Missing Airtable env vars" });

  const { q = "", cluster = "", limit = "50", cursor = "" } = req.query;

  // Field names (case-sensitive in Airtable)
  const F_TITLE    = "Title";
  const F_ABS      = "Abstract";
  const F_CIT      = "Citation";
  const F_DATE     = "Date";
  const F_CLUSTER1 = "cluster"; // your new name
  const F_CLUSTER2 = "Cluster"; // fallback if some records still use old name

  // Build an Airtable formula that:
  // - Optionally matches text against title/abstract/citation
  // - Optionally matches cluster (works for single or multi select)
  const parts = [];

  if (q) {
    // Search across three fields using LOWER + FIND
    const safe = String(q).replace(/"/g, '\\"');
    parts.push(
      `OR(` +
        `FIND(LOWER("${safe}"), LOWER({${F_TITLE}}&""))>0,` +
        `FIND(LOWER("${safe}"), LOWER({${F_ABS}}&""))>0,` +
        `FIND(LOWER("${safe}"), LOWER({${F_CIT}}&""))>0` +
      `)`
    );
  }

  if (cluster) {
    const safeC = String(cluster).replace(/"/g, '\\"');
    // Handle either field name, and either single or multi select
    parts.push(
      `OR(` +
        `{${F_CLUSTER1}}="${safeC}",` +
        `FIND("${safeC}", ARRAYJOIN({${F_CLUSTER1}}&""))>0,` +
        `{${F_CLUSTER2}}="${safeC}",` +
        `FIND("${safeC}", ARRAYJOIN({${F_CLUSTER2}}&""))>0` +
      `)`
    );
  }

  const formula = parts.length ? `AND(${parts.join(",")})` : "";
  const params = new URLSearchParams();
  if (formula) params.set("filterByFormula", formula);
  params.set("pageSize", String(Math.min(Number(limit) || 50, 100)));
  if (cursor) params.set("offset", cursor);

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${params.toString()}`;

  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: "Airtable error", detail: j });

    const items = (j.records || []).map((rec) => {
      const f = rec.fields || {};
      return {
        id: rec.id,
        title: f[F_TITLE] || "",
        abstract: f[F_ABS] || "",
        date: f[F_DATE] || "",
        cluster: f[F_CLUSTER1] || f[F_CLUSTER2] || "",
      };
    });

    return res.status(200).json({ items, nextCursor: j.offset || null });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
