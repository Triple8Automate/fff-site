// pages/api/archive.js
export default async function handler(req, res) {
  try {
    // --- DO NOT run this on edge; stick to node runtime for req.cookies support
    // If you had set: export const config = { runtime: 'edge' } remove it.

    // 1) Read the cookie safely
    let granted = false;

    // Next.js API routes normally populate req.cookies
    if (req.cookies && req.cookies.fff_granted === '1') {
      granted = true;
    } else {
      // Fallback: parse raw Cookie header
      const raw = req.headers.cookie || '';
      const map = Object.fromEntries(
        raw.split(';').map(kv => kv.trim().split('=').map(decodeURIComponent)).filter(x => x.length === 2)
      );
      if (map.fff_granted === '1') granted = true;
    }

    if (!granted) {
      return res.status(401).json({ error: 'Gate required' });
    }

    // 2) (Optional) Filter with Airtable envs if you added them
    const baseId  = process.env.AIRTABLE_BASE_ID;
    const token   = process.env.AIRTABLE_TOKEN;
    const table   = process.env.ARTICLES_TABLE || 'Articles';
    const view    = process.env.ARTICLES_VIEW || undefined; // e.g. 'Published'
    const publishField = process.env.ARTICLES_PUBLISH_FIELD || undefined; // e.g. 'Publish'

    // If you haven't wired Airtable yet for listing, return demo data so we can verify the gate:
    if (!baseId || !token) {
      return res.status(200).json({
        items: [
          { id: 'demo-1', slug: 'the-testosterone-trap', title: 'The Testosterone Trap', date: '2025-10-19', topic: 'Hormones' },
          { id: 'demo-2', slug: 'dopamine-dominance',    title: 'Dopamine Dominance',    date: '2025-10-18', topic: 'Neuro'    },
        ],
      });
    }

    // --- Real Airtable listing (optional; keep demo first while debugging)
    const search = new URLSearchParams();
    search.set('pageSize', '100');
    if (view) search.set('view', view);

    // Optional publish filter formula
    let formula = '';
    if (publishField) {
      formula = `AND({${publishField}} = 1)`;
      search.set('filterByFormula', formula);
    }

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${search}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await r.text();
    if (!r.ok) {
      let detail; try { detail = JSON.parse(text); } catch { detail = text; }
      return res.status(r.status).json({ error: 'Airtable error', status: r.status, detail });
    }

    const data = JSON.parse(text);
    const items = (data.records || []).map(rec => {
      const f = rec.fields || {};
      return {
        id: rec.id,
        slug: f.slug || f.Slug || f.slugify || '',
        title: f.title || f.Title || '',
        date: f.date || f.Date || '',
        topic: f.topic || f.Topic || '',
      };
    });

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', detail: String(e).slice(0, 800) });
  }
}
