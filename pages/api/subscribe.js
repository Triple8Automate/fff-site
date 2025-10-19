// /pages/api/subscribe.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, source = "archive-gate" } = req.body || {};
    const okEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!okEmail) return res.status(400).json({ error: "Invalid email" });

    // Meta (optional)
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
    const ua = req.headers["user-agent"] || "";
    const ts = new Date().toISOString();

    // ---- Airtable REST API ----
    const token   = process.env.AIRTABLE_TOKEN;        // PAT
    const baseId  = process.env.AIRTABLE_BASE_ID;      // appXXXXXXXXXXXXXX
    const table   = process.env.AIRTABLE_TABLE_NAME;   // e.g. Subscribers

    if (!token || !baseId || !table) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
    const payload = {
      records: [
        {
          fields: {
            Email: email,
            Source: source,
            IP: ip,
            UserAgent: ua,
            Timestamp: ts
          }
        }
      ]
    };

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: "Airtable error", detail: text.slice(0, 600) });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e).slice(0, 600) });
  }
}
