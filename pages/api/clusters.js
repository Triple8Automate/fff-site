// pages/api/clusters.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token  = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_ARTICLES_TABLE || process.env.AIRTABLE_TABLE_NAME || "Articles";
  if (!token || !baseId || !table) return res.status(500).json({ error: "Missing Airtable env vars" });

  const F_CLUSTER1 = "Clusters";
  const F_CLUSTER2 = "Cluster";

  const seen = new Set();
  let offset = "";
  let guard = 0;

  try {
    do {
      const p = new URLSearchParams();
      p.set("pageSize", "100");
      if (offset) p.set("offset", offset);

      const r = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${p.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: "Airtable error", detail: j });

      for (const rec of j.records || []) {
        const f = rec.fields || {};
        const val = f[F_CLUSTER1] ?? f[F_CLUSTER2];
        if (!val) continue;
        // val may be string (single select) or array (multi)
        if (Array.isArray(val)) val.forEach((v) => v && seen.add(String(v)));
        else seen.add(String(val));
      }

      offset = j.offset || "";
      guard += 1;
    } while (offset && guard < 50); // safety guard
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }

  return res.status(200).json({ clusters: Array.from(seen).sort() });
}
