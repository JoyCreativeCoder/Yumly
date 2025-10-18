import type { VercelRequest, VercelResponse } from "@vercel/node";

function pickCalories(nutrition?: {
  nutrients?: Array<{ name: string; amount: number }>;
}) {
  const cal = nutrition?.nutrients?.find(
    (n) => n.name?.toLowerCase() === "calories"
  );
  return typeof cal?.amount === "number" ? Math.round(cal.amount) : null;
}

function scoreCandidate(title: string, query: string) {
  const t = title.toLowerCase();
  const q = query.toLowerCase();

  // 1) direct substring match
  const substrHit = t.includes(q) ? 1 : 0;

  // 2) token overlap (simple Jaccard-ish)
  const qTokens = q.split(/\s+/).filter(Boolean);
  const tTokens = t.split(/\s+/).filter(Boolean);
  const qSet = new Set(qTokens);
  const tSet = new Set(tTokens);
  let overlap = 0;
  qSet.forEach((w) => {
    if (tSet.has(w)) overlap += 1;
  });
  const tokenScore =
    qTokens.length > 0 ? overlap / Math.max(qTokens.length, 1) : 0;

  // Weighted: favor exact substring, then token overlap
  return substrHit * 2 + tokenScore;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const q = String(req.query.query || "").trim();
    if (!q) return res.status(400).json({ error: "Missing query" });

    const key = process.env.SPOONACULAR_KEY;
    if (!key) return res.status(500).json({ error: "Server API key missing" });

    // Fetch multiple candidates; let us pick the best one.
    const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
    url.search = new URLSearchParams({
      apiKey: key,
      query: q,
      number: "10",
      addRecipeInformation: "true",
      addRecipeNutrition: "true",
    }).toString();

    // Add a small timeout so dev/builds don’t hang forever
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10_000);

    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(t);

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(r.status).json({
        error: "Upstream error",
        details: text || r.statusText,
        requested: url.toString(),
      });
    }

    const data = await r.json();
    const items: any[] = Array.isArray(data?.results) ? data.results : [];
    if (!items.length) {
      // Try a looser query fallback (first word) to be helpful
      const firstWord = q.split(/\s+/)[0] || q;
      return res.json({ id: null, hint: `No match. Try "${firstWord}".` });
    }

    // Re-rank candidates
    items.sort((a, b) => {
      const sa = scoreCandidate(String(a.title || ""), q);
      const sb = scoreCandidate(String(b.title || ""), q);
      // tie-breaker: prefer ones with readyInMinutes (less null)
      const tie =
        sb - sa ||
        ((b.readyInMinutes ?? 9999) - (a.readyInMinutes ?? 9999)) * 0.0001;
      return tie;
    });

    const best = items[0];

    return res.json({
      id: best.id,
      title: best.title,
      image: best.image,
      readyInMinutes: best.readyInMinutes ?? null,
      servings: best.servings ?? null,
      calories: pickCalories(best.nutrition), // may be null; UI should hide if null
    });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return res.status(504).json({ error: "Upstream timeout" });
    }
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
