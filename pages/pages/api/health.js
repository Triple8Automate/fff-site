export default function handler(req, res) {
  res.status(200).json({ ok: true, app: "fff-site", ts: Date.now() });
}
