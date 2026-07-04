// [A3] Vercel Serverless Function — Google 翻譯代理
// 目的：把翻譯 API 金鑰移到伺服器端環境變數，不再隨前端原始碼外洩。
// 設定方式：Vercel 專案 → Settings → Environment Variables →
//   新增 GOOGLE_TRANSLATE_KEY（值 = 已限制只開 Translation API 的新金鑰）
// 未設定時回 501，前端會自動退回舊的直連模式（過渡期不中斷服務）。
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.GOOGLE_TRANSLATE_KEY;
  if (!key) {
    return res.status(501).json({ error: 'translate proxy not configured' });
  }

  const { q, target } = req.body || {};
  if (!q || !target || typeof q !== 'string' || q.length > 1000) {
    return res.status(400).json({ error: 'bad request' });
  }

  try {
    const upstream = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, target, format: 'text' }),
      }
    );
    const data = await upstream.json();
    return res.status(upstream.ok ? 200 : upstream.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'upstream error' });
  }
}
