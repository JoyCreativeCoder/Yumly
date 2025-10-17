import type { VercelRequest, VercelResponse } from "@vercel/node";

function pickCalories(nutrition?: {
  nutrients?: Array<{ name: string; amount: number }>;
}) {
  const cal = nutrition?.nutrients?.find(
    (n) => n.name?.toLowerCase() === "calories"
  );
  return typeof cal?.amount === "number" ? Math.round(cal.amount) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const q = String(req.query.query || "").trim();
    if (!q) return res.status(400).json({ error: "Missing query" });

    const key = process.env.SPOONACULAR_KEY;
    if (!key) return res.status(500).json({ error: "Server API key missing" });

    // Build URL with the exact fields we need for badges
    const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
    url.search = new URLSearchParams({
      apiKey: key,
      query: q,
      number: "1",
      addRecipeInformation: "true",
      addRecipeNutrition: "true", // <- calories
      instructionsRequired: "true",
    }).toString();

    // Add a small timeout so builds don’t hang forever
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
    const first = data?.results?.[0];
    if (!first) return res.json({ id: null }); // frontend shows a neat empty state

    return res.json({
      id: first.id,
      title: first.title,
      image: first.image,
      readyInMinutes: first.readyInMinutes ?? null,
      servings: first.servings ?? null,
      calories: pickCalories(first.nutrition), // may be null; UI should hide if null
    });
  } catch (e: any) {
    // AbortError = timeout -> surface a friendly message
    if (e?.name === "AbortError") {
      return res.status(504).json({ error: "Upstream timeout" });
    }
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
