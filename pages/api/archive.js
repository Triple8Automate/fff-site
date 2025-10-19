// pages/api/archive.js
export default async function handler(req, res) {
  try {
    const token  = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_TABLE_NAME || "Articles";
    if (!token || !baseId || !table) {
      return res.status(500).json({ error: "Missing env" });
    }

    const { q = "", cluster = "", cursor = "", limit = "50" } = req.query;

    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
    url.searchParams.set("pageSize", String(Math.min(parseInt(limit, 10) || 50, 100)));
    if (cursor) url.searchParams.set("offset", cursor);

    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const j = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: "Airtable error", detail: j });
    }

    const items = (j.records || []).map((rec) => {
      const f = rec.fields || {};

      // Collect FFF Summary 1..20 automatically (present & non-empty)
      const summaries = [];
      for (let i = 1; i <= 20; i++) {
        const v = f[`FFF Summary ${i}`];
        if (v && String(v).trim()) summaries.push(String(v));
      }

      return {
        id: rec.id,
        title: f.Title || "",
        summaries, // <-- array of strings
        abstract: f["Article Abstract"] || f.Abstract || "",
        citation: f["Full Citation"] || f.Citation || "",
        cluster: f.Cluster || f.cluster || "",
        date: f.Date || f.Published || "",
      };
    });

    // Filtering
    let out = items;
    const qlc = String(q).trim().toLowerCase();
    const cl  = String(cluster).trim();
    if (qlc) {
      out = out.filter((a) => {
        const hay =
          (a.title || "") +
          " " +
          (a.abstract || "") +
          " " +
          (a.citation || "") +
          " " +
          (a.summaries || []).join(" ");
        return hay.toLowerCase().includes(qlc);
      });
    }
    if (cl) out = out.filter((a) => String(a.cluster) === cl);

    res.status(200).json({ items: out, nextCursor: j.offset || null });
  } catch (e) {
    res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
