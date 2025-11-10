// import type { VercelRequest, VercelResponse } from "@vercel/node";

// function roundCalories(nutrition?: {
//   nutrients?: Array<{ name: string; amount: number }>;
// }) {
//   const cal = nutrition?.nutrients?.find(
//     (n) => n.name?.toLowerCase() === "calories"
//   )?.amount;
//   return typeof cal === "number" ? Math.round(cal) : null;
// }

// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   try {
//     const id = String(req.query.id ?? "").trim();
//     if (!id) return res.status(400).json({ error: "Missing id" });

//     const key = process.env.SPOONACULAR_KEY;
//     if (!key) return res.status(500).json({ error: "Server API key missing" });

//     const url = new URL(
//       `https://api.spoonacular.com/recipes/${encodeURIComponent(
//         id
//       )}/information`
//     );
//     url.search = new URLSearchParams({
//       apiKey: key,
//       includeNutrition: "true",
//     }).toString();

//     // Timeout so dev/deploys don't hang
//     const controller = new AbortController();
//     const t = setTimeout(() => controller.abort(), 10_000);

//     const r = await fetch(url, { signal: controller.signal });
//     clearTimeout(t);

//     if (!r.ok) {
//       const text = await r.text().catch(() => "");
//       return res.status(r.status).json({
//         error: "Upstream error",
//         details: text || r.statusText,
//         requested: url.toString(),
//       });
//     }

//     const data = await r.json();

//     // Flatten *all* instruction blocks → array of trimmed strings
//     const steps: string[] = (data.analyzedInstructions ?? [])
//       .flatMap((block: any) => block?.steps ?? [])
//       .map((s: any) => String(s?.step ?? "").trim())
//       .filter(Boolean);

//     const ingredients = (data.extendedIngredients ?? []).map((i: any) => ({
//       name: String(i?.name ?? "").trim(),
//       amount: typeof i?.amount === "number" ? i.amount : null,
//       unit: String(i?.unit ?? "").trim() || null,
//     }));

//     const payload = {
//       id: data.id,
//       title: data.title ?? null,
//       image: data.image ?? null,
//       readyInMinutes: data.readyInMinutes ?? null,
//       servings: data.servings ?? null,
//       calories: roundCalories(data.nutrition),
//       ingredients,
//       steps,
//       sourceUrl: data.sourceUrl ?? null,
//     };

//     return res.status(200).json(payload);
//   } catch (e: any) {
//     if (e?.name === "AbortError") {
//       return res.status(504).json({ error: "Upstream timeout" });
//     }
//     return res.status(500).json({ error: e?.message || "Server error" });
//   }
// }

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1️⃣ Get the recipe "id" from the URL (actually the recipe title)
    const id = String(req.query.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing recipe ID" });

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const GOOGLE_CX = process.env.GOOGLE_CX_ID;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!GOOGLE_API_KEY || !GOOGLE_CX)
      return res.status(500).json({ error: "Missing Google API credentials" });

    // 2️⃣ Format the recipe title (replace dashes with spaces)
    const formattedTitle = id.replace(/-/g, " ");

    // 3️⃣ Fetch image from Google Custom Search
    const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      formattedTitle
    )}&cx=${GOOGLE_CX}&key=${GOOGLE_API_KEY}&searchType=image&num=1`;

    const googleRes = await fetch(searchUrl);
    if (!googleRes.ok) throw new Error("Failed to fetch image from Google API");

    const googleData = await googleRes.json();
    const imageUrl = googleData.items?.[0]?.link || null;

    // 4️⃣ Fetch recipe details from OpenAI
    let ingredients: string[] = [];
    let steps: string[] = [];

    if (OPENAI_API_KEY) {
      try {
        const openAIRes = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a recipe extractor. Return structured recipe details in JSON: {ingredients: string[], steps: string[]} based on the title.",
                },
                { role: "user", content: formattedTitle },
              ],
            }),
          }
        );

        const openAIData = await openAIRes.json();
        const raw = openAIData?.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(raw);

        ingredients = Array.isArray(parsed.ingredients)
          ? parsed.ingredients
          : [];
        steps = Array.isArray(parsed.steps) ? parsed.steps : [];
      } catch (err) {
        console.warn("OpenAI parse error:", err);
      }
    }

    // 5️⃣ Return final structured recipe
    const recipe = {
      id,
      title: formattedTitle,
      image: imageUrl,
      ingredients,
      steps,
    };

    return res.status(200).json(recipe);
  } catch (err: any) {
    console.error("Recipe details error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
