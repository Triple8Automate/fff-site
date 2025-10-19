export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, source = "archive-gate" } = req.body || {};
    const okEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!okEmail) return res.status(400).json({ error: "Invalid email" });

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
    const ua = req.headers["user-agent"] || "";
    const ts = new Date().toISOString();

    const token  = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_TABLE_NAME;

    if (!token || !baseId || !table) {
      return res.status(500).json({
        error: "Missing Airtable env vars",
        have: {
          AIRTABLE_TOKEN: !!token,
          AIRTABLE_BASE_ID: !!baseId,
          AIRTABLE_TABLE_NAME: !!table,
        },
      });
    }

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
    const payload = {
      records: [
        {
          fields: { Email: email, Source: source, IP: ip, UserAgent: ua, Timestamp: ts },
        },
      ],
    };

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text(); // capture full upstream body for debugging
    if (!r.ok) {
      // try to parse JSON for helpful messages
      let detail;
      try { detail = JSON.parse(text); } catch { detail = text; }
      return res.status(r.status).json({
        error: "Airtable error",
        status: r.status,
        detail,
        hint: "Check PAT scope/access, Base ID, Table name, and field names.",
      });
    }

    // success
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e).slice(0, 800) });
  }
}
