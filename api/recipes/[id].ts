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
    const id = String(req.query.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing recipe ID" });

    const googleKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!googleKey || !cx) {
      return res.status(500).json({ error: "Missing Google API credentials" });
    }

    // 1️⃣ --- Google Search for Recipe ---
    const formattedId = id.replace(/-/g, " ");
    const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      formattedId + " recipe"
    )}&cx=${cx}&key=${googleKey}`;

    const googleRes = await fetch(searchUrl);
    if (!googleRes.ok) throw new Error("Failed to fetch from Google API");

    const googleData = await googleRes.json();
    const firstResult = googleData.items?.[0];

    if (!firstResult)
      return res.status(404).json({ error: "No recipe found for this title" });

    // 2️⃣ --- Basic Data from Google ---
    const recipe = {
      id,
      title: firstResult.title || formattedId,
      image: firstResult.pagemap?.cse_image?.[0]?.src || null,
      link: firstResult.link,
      snippet: firstResult.snippet,
      servings: null,
      readyInMinutes: null,
      calories: null,
      ingredients: [] as string[],
      steps: [] as string[],
    };

    // 3️⃣ --- Enhance with OpenAI ---
    if (openaiKey) {
      try {
        const openAIResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a recipe extractor. Given a recipe title or snippet, return structured recipe details as valid JSON: {ingredients: string[], steps: string[]}.",
                },
                { role: "user", content: recipe.snippet || recipe.title },
              ],
            }),
          }
        );

        const aiJson = await openAIResponse.json();
        const raw = aiJson?.choices?.[0]?.message?.content || "{}";

        let parsedData = { ingredients: [], steps: [] };
        try {
          parsedData = JSON.parse(raw);
        } catch {
          console.warn("OpenAI returned non-JSON content:", raw);
        }

        recipe.ingredients = parsedData.ingredients || [];
        recipe.steps = parsedData.steps || [];
      } catch (err) {
        console.error("OpenAI parse error:", err);
      }
    }

    // ✅ --- Return final structured recipe ---
    return res.status(200).json(recipe);
  } catch (e: any) {
    console.error("Recipe details error:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
