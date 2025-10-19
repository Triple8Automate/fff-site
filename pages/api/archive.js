// pages/api/archive.js
export default async function handler(req, res) {
  try {
    const token  = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_ARTICLES_TABLE || "Articles";
    const view   = process.env.AIRTABLE_ARTICLES_VIEW || ""; // optional
    const publishField = process.env.AIRTABLE_ARTICLES_PUBLISH_FIELD || ""; // optional

    if (!token || !baseId || !table) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    // --- helpers
    const TABLE_URL = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
    const auth = { Authorization: `Bearer ${token}` };

    function pickCluster(record) {
      // Try common names, array or comma-separated
      const f = record.fields || {};
      const candidates = [
        f.Cluster, f.Clusters, f.Topic, f.Topics, f.Category, f.Categories
      ].filter(Boolean);

      if (!candidates.length) return [];

      const values = Array.isArray(candidates[0]) ? candidates[0] : String(candidates[0]).split(",");
      return values.map(s => String(s).trim()).filter(Boolean);
    }

    function mapRecord(record) {
      const f = record.fields || {};
      const title = f.Title || f.title || f.Name || f.name || "";
      const slug  = f.Slug || f.slug || "";
      const date  = f.Date || f.date || "";
      const abs   = f.Abstract || f["Article Abstract"] || f.Summary || f["FFF Summary 1"] || "";
      const cite  = f.Citation || f["Full Citation"] || "";
      const url   = f.URL || f.Link || f.href || "";

      return {
        id: record.id,
        title,
        slug,
        date,
        cluster: pickCluster(record),
        abstract: abs,
        citation: cite,
        url: url || (slug ? `/articles/${slug}` : ""),
      };
    }

    // =========================================================
    // MODE A: return full cluster list (all pages)
    // =========================================================
    if (req.query.allClusters === "1") {
      const clusters = new Set();
      let offset;

      // Pull minimal fields only for speed
      const params = new URLSearchParams();
      if (view) params.set("view", view);
      params.set("pageSize", "100");
      // Only fetch fields that may contain cluster taxonomy
      ["Cluster","Clusters","Topic","Topics","Category","Categories"].forEach((name, idx) =>
        params.append("fields[]", name)
      );
      // Optional publish filter
      if (publishField) {
        params.set(
          "filterByFormula",
          encodeURIComponent(`{${publishField}} = 1`)
        );
      }

      do {
        const url = `${TABLE_URL}?${params.toString()}${offset ? `&offset=${offset}` : ""}`;
        const r = await fetch(url, { headers: auth });
        const data = await r.json();
        if (!r.ok) {
          return res.status(r.status).json({ error: "Airtable error", detail: data });
        }

        for (const rec of data.records || []) {
          pickCluster(rec).forEach(c => clusters.add(c));
        }
        offset = data.offset;
      } while (offset);

      return res.status(200).json({
        clusters: Array.from(clusters).sort((a,b)=>a.localeCompare(b)),
      });
    }

    // =========================================================
    // MODE B: normal items query (search, filter, pagination)
    // =========================================================
    const {
      q = "",
      cluster = "",
      cursor = "",     // Airtable offset
      limit = "50",    // 50 is a good default
    } = req.query;

    const params = new URLSearchParams();
    if (view) params.set("view", view);
    params.set("pageSize", String(Math.max(1, Math.min(100, Number(limit) || 50))));
    if (cursor) params.set("offset", cursor);

    // Fields we actually need for list rows
    ["Title","title","Name","name","Slug","slug","Date","date",
     "Cluster","Clusters","Topic","Topics","Category","Categories",
     "Abstract","Article Abstract","Summary","FFF Summary 1",
     "Citation","Full Citation","URL","Link","href"
    ].forEach(f => params.append("fields[]", f));

    // Build filterByFormula for search + cluster + publish
    const formulas = [];

    if (publishField) formulas.push(`{${publishField}} = 1`);

    if (q) {
      // Search across title + abstract + citation
      const ors = [
        `FIND(LOWER("${q}"), LOWER({Title}&" "&{title}&" "&{Name}&" "&{name}))`,
        `FIND(LOWER("${q}"), LOWER({Abstract}&" "&{Article Abstract}&" "&{Summary}&" "&{FFF Summary 1}))`,
        `FIND(LOWER("${q}"), LOWER({Citation}&" "&{Full Citation}))`,
      ];
      formulas.push(`OR(${ors.join(",")})`);
    }

    if (cluster) {
      const clusterOrs = [
        `{Cluster} = "${cluster}"`,
        `FIND(", ${cluster},", ", " & {Clusters} & ",")`,
        `{Topic} = "${cluster}"`,
        `FIND(", ${cluster},", ", " & {Topics} & ",")`,
        `{Category} = "${cluster}"`,
        `FIND(", ${cluster},", ", " & {Categories} & ",")`,
      ];
      formulas.push(`OR(${clusterOrs.join(",")})`);
    }

    if (formulas.length) {
      params.set("filterByFormula", `AND(${formulas.join(",")})`);
    }

    const url = `${TABLE_URL}?${params.toString()}`;
    const r = await fetch(url, { headers: auth });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: "Airtable error", detail: data });
    }

    // Map records
    const items = (data.records || []).map(mapRecord);

    // Basic per-page cluster list as meta (handy but not complete)
    const clusters = Array.from(
      new Set(items.flatMap(i => i.cluster))
    ).sort((a,b)=>a.localeCompare(b));

    return res.status(200).json({
      items,
      nextCursor: data.offset || null,
      clusters, // per-page clusters (use allClusters=1 for the full taxonomy)
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e).slice(0,800) });
  }
}
