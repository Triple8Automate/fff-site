// pages/api/subscribe.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, source = "archive-gate" } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const ua = req.headers["user-agent"] || "";

    const token  = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_TABLE_NAME;

    if (!token || !baseId || !table) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    // Map EXACTLY to your Airtable column names; omit Timestamp (it's read-only)
    const fields = {
      Email: email,
      Source: source,
      IP: ip,
      UserAgent: ua,
    };

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
      table
    )}`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }] }),
    });

    const text = await r.text();
    if (!r.ok) {
      let detail;
      try { detail = JSON.parse(text); } catch { detail = text; }
      return res
        .status(r.status)
        .json({ error: "Airtable error", status: r.status, detail });
    }

    // 🔐 Gate cookie so the archive API/pages can verify access
    // - Max-Age: 1 year
    // - SameSite=Lax stops most CSRF without breaking normal nav
    // - Secure works on HTTPS (Vercel is HTTPS)
    res.setHeader(
      "Set-Cookie",
      "fff_granted=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure"
    );

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Server error", detail: String(e).slice(0, 800) });
  }
}
