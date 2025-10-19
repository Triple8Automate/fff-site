// pages/api/clusters.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token  = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_NAME; // e.g. "Articles"

  if (!token || !baseId || !table) {
    return res.status(500).json({ error: "Missing Airtable env vars" });
  }

  try {
    const distinct = new Set();
    let offset = undefined;
    let safety = 0;

    // Pull only the Cluster field to be efficient
    do {
      const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
      url.searchParams.set("fields[]", "Cluster");
      if (offset) url.searchParams.set("offset", offset);
      url.searchParams.set("pageSize", "100");

      const r = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await r.text();
      if (!r.ok) {
        let detail; try { detail = JSON.parse(text); } catch { detail = text; }
        return res.status(r.status).json({ error: "Airtable error", detail });
      }

      const j = JSON.parse(text);
      for (const rec of j.records || []) {
        const c = rec.fields?.Cluster;
        if (Array.isArray(c)) c.forEach(v => v && distinct.add(v));
        else if (typeof c === "string" && c) distinct.add(c);
      }
      offset = j.offset;
      safety++;
    } while (offset && safety < 200); // safety cap

    return res.status(200).json({ clusters: Array.from(distinct).sort() });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e).slice(0, 800) });
  }
}
