// pages/api/article.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token  = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_ARTICLES_TABLE || "Articles";

    if (!token || !baseId || !table) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "Airtable error", detail: data });
    }

    const f = data.fields || {};
    res.status(200).json({
      id: data.id,
      title: f["Title"] || "Untitled",
      date: f["Date"] || f["Published"] || null,
      cluster: f["Cluster"] || null,
      abstract: f["Article Abstract"] || null,
      citation: f["Full Citation"] || null,
      s1: f["FFF Summary 1"] || null,
      s2: f["FFF Summary 2"] || null,
      s3: f["FFF Summary 3"] || null,
      s4: f["FFF Summary 4"] || null,
    });
  } catch (e) {
    res.status(500).json({ error: "Server error", detail: String(e).slice(0, 800) });
  }
}
