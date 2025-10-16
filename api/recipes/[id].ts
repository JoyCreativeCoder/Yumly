import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "Missing id" });

    const key = process.env.SPOONACULAR_KEY;
    if (!key) return res.status(500).json({ error: "Server API key missing" });

    const url = `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=true&apiKey=${key}`;
    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      return res
        .status(r.status)
        .json({ error: "Upstream error", details: text });
    }
    const data = await r.json();

    const calories =
      data?.nutrition?.nutrients?.find(
        (n: any) => String(n.name).toLowerCase() === "calories"
      )?.amount ?? null;

    res.status(200).json({
      id: data.id,
      title: data.title,
      image: data.image,
      readyInMinutes: data.readyInMinutes,
      servings: data.servings,
      calories,
      ingredients: (data.extendedIngredients || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        amount: i.amount,
        unit: i.unit,
      })),
      steps: (data.analyzedInstructions?.[0]?.steps || []).map((s: any) => ({
        number: s.number,
        text: s.step,
      })),
      sourceUrl: data.sourceUrl,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
}
