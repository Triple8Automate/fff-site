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
  const table  = process.env.AIRTABLE_ARTICLES_TABLE || "Articles";
  const view   = process.env.AIRTABLE_ARTICLES_VIEW || "";                  // optional: limit to a View
  const publishField = process.env.AIRTABLE_ARTICLES_PUBLISH_FIELD || "";   // optional: e.g. "Published"

  if (!token || !baseId || !table) {
    return res.status(500).json({ error: "Missing Airtable env vars" });
  }

  try {
    const params = new URLSearchParams();
    if (view) params.append("view", view);
    if (publishField) params.append("filterByFormula", `{${publishField}}`);

    // We request only safe fields (no PDF columns)
    [
      "Title",
      "Slug",
      "Date",
      "FFF Summary 1",
      "FFF Summary 2",
      "Article Abstract",
      "Full Citation",
      "DOI",
      "URL"
    ].forEach(f => params.append("fields[]", f));

    params.append("sort[0][field]", "Date");
    params.append("sort[0][direction]", "desc");
    params.append("pageSize", "100");

    let offset = null;
    const items = [];

    do {
      const url = `${AIRTABLE_URL(table, baseId)}?${params.toString()}${offset ? `&offset=${offset}` : ""}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: "Airtable error", detail: j });

      for (const rec of j.records || []) {
        const f = rec.fields || {};
        const title = f["Title"] || `Untitled ${rec.id.slice(-4)}`;
        const slug  =
          f["Slug"] ||
          title.toLowerCase().replace(/[^\w\s-]/g,"").trim().replace(/[\s_-]+/g,"-");
        const date  = f["Date"] || rec.createdTime?.slice(0,10) || "";

        items.push({
          id: rec.id,
          title,
          slug,
          date,
          fff1:     f["FFF Summary 1"] || "",
          fff2:     f["FFF Summary 2"] || "",
          abstract: f["Article Abstract"] || "",
          citation: f["Full Citation"] || "",
          doi:      f["DOI"] || "",
          url:      f["URL"] || ""
        });
      }

      offset = j.offset;
    } while (offset);

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e).slice(0,800) });
  }
}
