import type { VercelRequest, VercelResponse } from "@vercel/node";

function roundCalories(nutrition?: {
  nutrients?: Array<{ name: string; amount: number }>;
}) {
  const cal = nutrition?.nutrients?.find(
    (n) => n.name?.toLowerCase() === "calories"
  )?.amount;
  return typeof cal === "number" ? Math.round(cal) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = String(req.query.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing id" });

    const key = process.env.SPOONACULAR_KEY;
    if (!key) return res.status(500).json({ error: "Server API key missing" });

    const url = new URL(
      `https://api.spoonacular.com/recipes/${encodeURIComponent(
        id
      )}/information`
    );
    url.search = new URLSearchParams({
      apiKey: key,
      includeNutrition: "true",
    }).toString();

    // Timeout so dev/deploys don't hang
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

    // Flatten *all* instruction blocks → array of trimmed strings
    const steps: string[] = (data.analyzedInstructions ?? [])
      .flatMap((block: any) => block?.steps ?? [])
      .map((s: any) => String(s?.step ?? "").trim())
      .filter(Boolean);

    const ingredients = (data.extendedIngredients ?? []).map((i: any) => ({
      name: String(i?.name ?? "").trim(),
      amount: typeof i?.amount === "number" ? i.amount : null,
      unit: String(i?.unit ?? "").trim() || null,
    }));

    const payload = {
      id: data.id,
      title: data.title ?? null,
      image: data.image ?? null,
      readyInMinutes: data.readyInMinutes ?? null,
      servings: data.servings ?? null,
      calories: roundCalories(data.nutrition),
      ingredients,
      steps,
      sourceUrl: data.sourceUrl ?? null,
    };

    return res.status(200).json(payload);
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return res.status(504).json({ error: "Upstream timeout" });
    }
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
