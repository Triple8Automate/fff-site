// pages/api/archive.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token  = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_ARTICLES_TABLE || process.env.AIRTABLE_TABLE_NAME; // fallback
    const view   = process.env.AIRTABLE_ARTICLES_VIEW || ""; // optional
    const publishField = process.env.AIRTABLE_ARTICLES_PUBLISH_FIELD || ""; // e.g. "Publish"

    if (!token || !baseId || !table) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    const {
      q = "",                 // search query
      cluster = "",           // cluster/topic filter (exact match)
      limit = "50",           // client can ask smaller page sizes (max 100 per Airtable)
      cursor = "",            // Airtable "offset" for pagination
    } = req.query;

    const size = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    // Build filterByFormula
    const terms = (q || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5); // keep it sane

    // Fields we search across (match your Airtable field names)
    const F = {
      title: ["Title", "title"],
      abstract: ["Abstract", "article abstract", "summary", "Summary"],
      cluster: ["Cluster", "Topic", "Topics", "Category"],
      author: ["Author", "Authors"],
      citation: ["Citation", "Full Citation"],
    };

    // Helper to formula-OR across fields for a single term
    const orFindTerm = (term, fieldNames) =>
      `OR(${fieldNames.map(fn =>
        `FIND(LOWER("${escapeFormula(term)}"), LOWER({${fn}}))`
      ).join(",")})`;

    // For each search term, we want it to appear in any field (OR),
    // and all terms must be present overall (AND of those ORs).
    const searchFormula =
      terms.length === 0
        ? ""
        : `AND(${terms
            .map(t =>
              orFindTerm(t, [
                ...F.title, ...F.abstract, ...F.cluster, ...F.author, ...F.citation,
              ])
            )
            .join(",")})`;

    // Cluster filter (exact match on any of the cluster-like fields)
    const clusterFormula = cluster
      ? `OR(${F.cluster.map(fn => `{${fn}} = "${escapeFormula(cluster)}"`).join(",")})`
      : "";

    // Publish filter (only when you provided a publish field)
    const publishFormula = publishField
      ? `{${publishField}}`
      : "";

    // Combine non-empty formula pieces with AND
    const pieces = [publishFormula, searchFormula, clusterFormula].filter(Boolean);
    const filterByFormula = pieces.length ? `AND(${pieces.join(",")})` : "";

    const params = new URLSearchParams();
    params.set("pageSize", String(size));
    if (view) params.set("view", view);
    if (filterByFormula) params.set("filterByFormula", filterByFormula);
    if (cursor) params.set("offset", cursor);

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${params.toString()}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await r.text();
    if (!r.ok) {
      let detail; try { detail = JSON.parse(text); } catch { detail = text; }
      return res.status(r.status).json({ error: "Airtable error", status: r.status, detail });
    }
    const data = JSON.parse(text);

    // Map fields exactly (add/rename to match your base)
    const items = (data.records || []).map(rec => {
      const f = rec.fields || {};
      return {
        id: rec.id,
        slug: f.slug || f.Slug || f.slugify || "",
        title: f.title || f.Title || "",
        date: f.date || f.Date || "",
        cluster: f.Cluster || f.Topic || f.Topics || f.Category || "",
        abstract: f.Abstract || f["Article Abstract"] || "",
        citation: f.Citation || f["Full Citation"] || "",
        url: f.url || f.URL || f.Link || f.link || f.href || "", // external publisher/DOI page
      };
    });

    res.status(200).json({
      items,
      nextCursor: data.offset || null, // pass this back to clients for "Load more"
    });
  } catch (e) {
    res.status(500).json({ error: "Server error", detail: String(e).slice(0, 800) });
  }
}

// Airtable formula escaping (very simple, enough for FIND/LOWER usage)
function escapeFormula(s) {
  return String(s).replace(/"/g, '\\"');
}
