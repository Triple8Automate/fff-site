// pages/api/archive.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token  = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_ARTICLES_TABLE || "Articles";         // <— your table name
    const view   = process.env.AIRTABLE_ARTICLES_VIEW  || undefined;          // optional

    if (!token || !baseId || !table) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    const { q = "", cluster = "", limit = "50", cursor = "" } = req.query;

    // Build filterByFormula: search in Title, FFF Summary 1..4, Article Abstract, Full Citation
    const safe = (s) => String(s).replace(/"/g, '\\"');
    const needles = q ? `"${safe(q)}"` : null;

    const pieces = [];

    if (needles) {
      const searchable = [
        "{Title}",
        "{FFF Summary 1}",
        "{FFF Summary 2}",
        "{FFF Summary 3}",
        "{FFF Summary 4}",
        "{Article Abstract}",
        "{Full Citation}",
      ].map((f) => `FIND(${needles}, ${f})`);

      // OR(FIND(q,field1), FIND(q,field2), ...)
      pieces.push(`OR(${searchable.join(",")})`);
    }

    if (cluster) {
      // single-select exact match
      pieces.push(`{Clusters} = "${safe(cluster)}"`);
    }

    const filter = pieces.length ? `filterByFormula=${encodeURIComponent(`AND(${pieces.join(",")})`)}` : "";

    const params = [
      filter,
      view ? `view=${encodeURIComponent(view)}` : "",
      `pageSize=${encodeURIComponent(String(Math.min(Number(limit) || 50, 100)))}`,
      cursor ? `offset=${encodeURIComponent(cursor)}` : "",
    ]
      .filter(Boolean)
      .join("&");

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${params}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "Airtable error", detail: data });
    }

    // Map Airtable records into list items
    const items = (data.records || []).map((rec) => {
      const f = rec.fields || {};
      return {
        id: rec.id,
        title: f["Title"] || null,
        date: f["Date"] || f["Published"] || null,
        cluster: f["Clusters"] || null,
        abstract: f["Article Abstract"] || null,
        // summaries (short blurbs for preview if you want)
        s1: f["FFF Summary 1"] || null,
        s2: f["FFF Summary 2"] || null,
        s3: f["FFF Summary 3"] || null,
        s4: f["FFF Summary 4"] || null,
      };
    });

    res.status(200).json({
      items,
      nextCursor: data.offset || null,
    });
  } catch (e) {
    res.status(500).json({ error: "Server error", detail: String(e).slice(0, 800) });
  }
}
