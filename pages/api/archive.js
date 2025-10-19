// pages/api/archive.js

const AIRTABLE_URL = (table, base) =>
  `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`;

function hasGate(req) {
  const c = req.headers.cookie || "";
  return /(?:^|;\s*)fff_granted=1(?:;|$)/.test(c);
}

function toSlug(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!hasGate(req)) return res.status(401).json({ error: "Gate required" });

  const token  = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_ARTICLES_TABLE || "Articles";
  const view   = process.env.AIRTABLE_ARTICLES_VIEW || "";            // optional
  const publishField = process.env.AIRTABLE_ARTICLES_PUBLISH_FIELD || ""; // e.g. "Published"

  if (!token || !baseId || !table) {
    return res.status(500).json({ error: "Missing Airtable env vars" });
  }

  try {
    const params = new URLSearchParams();
    if (view) params.append("view", view);

    // If you set a publishField (checkbox), filter to only published rows
    if (publishField) {
      // In Airtable formulas, a checked checkbox is truthy just by referencing the field
      params.append("filterByFormula", `{${publishField}}`);
    }

    // Ask for a few likely fields up front (not required; we’ll still read whatever comes back)
    ["Title","Slug","Date","Topic","Category","Tags","PublishedDate","URL"].forEach(
      f => params.append("fields[]", f)
    );
    params.append("sort[0][field]", "Date"); // if it exists this will sort, otherwise Airtable ignores
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
        const title =
          f.Title ?? f.title ?? f.Name ?? f.name ?? `Untitled ${rec.id.slice(-4)}`;

        let slug = f.Slug ?? f.slug ?? null;
        if (!slug) slug = title ? toSlug(title) : rec.id;

        const date =
          f.Date ?? f.date ?? f.PublishedDate ?? f.publishedDate ?? rec.createdTime?.slice(0, 10) ?? "";

        const topic =
          f.Topic ?? f.topic ?? f.Category ?? (
            Array.isArray(f.Tags) ? f.Tags[0] :
            Array.isArray(f.tags) ? f.tags[0] : ""
          );

        const urlField = f.URL ?? f.Url ?? f.url ?? "";

        items.push({
          id: rec.id,
          title,
          slug,
          date,
          topic,
          url: urlField,
        });
      }
      offset = j.offset;
    } while (offset);

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e).slice(0, 800) });
  }
}
