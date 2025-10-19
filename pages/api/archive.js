// pages/api/archive.js
const AIRTABLE_URL = (table, base) =>
  `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`;

function hasGate(req) {
  const c = req.headers.cookie || "";
  return /(?:^|;\s*)fff_granted=1(?:;|$)/.test(c);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!hasGate(req)) return res.status(401).json({ error: "Gate required" });

  const token  = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_ARTICLES_TABLE || "Articles"; // set if different

  if (!token || !baseId || !table) {
    return res.status(500).json({ error: "Missing Airtable env vars" });
  }

  try {
    // Only return published articles & selected fields
    const params = new URLSearchParams();
    params.append("filterByFormula", "Published");
    params.append("sort[0][field]", "Date");
    params.append("sort[0][direction]", "desc");
    params.append("pageSize", "100");
    // expose only these columns (change to match your base)
    ["Title", "Slug", "Date", "Topic"].forEach(f => params.append("fields[]", f));

    let offset = null;
    const items = [];

    do {
      const url = `${AIRTABLE_URL(table, baseId)}?${params.toString()}${offset ? `&offset=${offset}` : ""}`;
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: "Airtable error", detail: j });

      for (const rec of j.records || []) {
        const f = rec.fields || {};
        items.push({
          id: rec.id,
          title: f.Title || "",
          slug: f.Slug || "",
          date: f.Date || "",
          topic: f.Topic || "",
        });
      }
      offset = j.offset;
    } while (offset);

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e).slice(0,800) });
  }
}
