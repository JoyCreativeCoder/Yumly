// import type { VercelRequest, VercelResponse } from "@vercel/node";

import { VercelRequest, VercelResponse } from "@vercel/node";

// function pickCalories(nutrition?: {
//   nutrients?: Array<{ name: string; amount: number }>;
// }) {
//   const cal = nutrition?.nutrients?.find(
//     (n) => n.name?.toLowerCase() === "calories"
//   );
//   return typeof cal?.amount === "number" ? Math.round(cal.amount) : null;
// }

// function scoreCandidate(title: string, query: string) {
//   const t = title.toLowerCase();
//   const q = query.toLowerCase();

//   // 1) direct substring match
//   const substrHit = t.includes(q) ? 1 : 0;

//   // 2) token overlap (simple Jaccard-ish)
//   const qTokens = q.split(/\s+/).filter(Boolean);
//   const tTokens = t.split(/\s+/).filter(Boolean);
//   const qSet = new Set(qTokens);
//   const tSet = new Set(tTokens);
//   let overlap = 0;
//   qSet.forEach((w) => {
//     if (tSet.has(w)) overlap += 1;
//   });
//   const tokenScore =
//     qTokens.length > 0 ? overlap / Math.max(qTokens.length, 1) : 0;

//   // Weighted: favor exact substring, then token overlap
//   return substrHit * 2 + tokenScore;
// }

// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   try {
//     const q = String(req.query.query || "").trim();
//     if (!q) return res.status(400).json({ error: "Missing query" });

//     const key = process.env.SPOONACULAR_KEY;
//     if (!key) return res.status(500).json({ error: "Server API key missing" });

//     // Fetch multiple candidates; let us pick the best one.
//     const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
//     url.search = new URLSearchParams({
//       apiKey: key,
//       query: q,
//       number: "10",
//       addRecipeInformation: "true",
//       addRecipeNutrition: "true",
//     }).toString();

//     // Add a small timeout so dev/builds don’t hang forever
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
//     const items: any[] = Array.isArray(data?.results) ? data.results : [];
//     if (!items.length) {
//       // Try a looser query fallback (first word) to be helpful
//       const firstWord = q.split(/\s+/)[0] || q;
//       return res.json({ id: null, hint: `No match. Try "${firstWord}".` });
//     }

//     // Re-rank candidates
//     items.sort((a, b) => {
//       const sa = scoreCandidate(String(a.title || ""), q);
//       const sb = scoreCandidate(String(b.title || ""), q);
//       // tie-breaker: prefer ones with readyInMinutes (less null)
//       const tie =
//         sb - sa ||
//         ((b.readyInMinutes ?? 9999) - (a.readyInMinutes ?? 9999)) * 0.0001;
//       return tie;
//     });

//     const best = items[0];

//     return res.json({
//       id: best.id,
//       title: best.title,
//       image: best.image,
//       readyInMinutes: best.readyInMinutes ?? null,
//       servings: best.servings ?? null,
//       calories: pickCalories(best.nutrition), // may be null; UI should hide if null
//     });
//   } catch (e: any) {
//     if (e?.name === "AbortError") {
//       return res.status(504).json({ error: "Upstream timeout" });
//     }
//     return res.status(500).json({ error: e?.message || "Server error" });
//   }
// }

//NEW>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>NEW>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// import type { VercelRequest, VercelResponse } from "@vercel/node";

// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   try {
//     const q = String(req.query.query || "").trim();
//     if (!q) return res.status(400).json({ error: "Missing query" });

//     const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
//     const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
//     const GOOGLE_CX_ID = process.env.GOOGLE_CX_ID;

//     if (!OPENAI_API_KEY || !GOOGLE_API_KEY || !GOOGLE_CX_ID) {
//       return res.status(500).json({ error: "Missing API keys in environment" });
//     }
//     const aiResponse = await fetch(
//       "https://api.openai.com/v1/chat/completions",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//         },
//         body: JSON.stringify({
//           model: "gpt-4o-mini",
//           messages: [
//             {
//               role: "system",
//               content:
//                 "You are a helpful recipe assistant. Always respond with valid JSON. Include: title, servings (number), readyInMinutes (number), calories (number), ingredients (array of strings), and steps (array of strings).",
//             },
//             {
//               role: "user",
//               content: `Generate a detailed recipe for "${q}".`,
//             },
//           ],
//         }),
//       }
//     );

//     const aiData = await aiResponse.json();
//     const content = aiData?.choices?.[0]?.message?.content || "{}";

//     let recipe: any = {};
//     try {
//       recipe = JSON.parse(content);
//     } catch {
//       recipe = {
//         title: q,
//         ingredients: [],
//         steps: [],
//         servings: null,
//         readyInMinutes: null,
//         calories: null,
//       };
//     }

//     const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX_ID}&searchType=image&q=${encodeURIComponent(
//       recipe.title || q
//     )}`;

//     const googleRes = await fetch(googleUrl);
//     const googleData = await googleRes.json();
//     const image = googleData.items?.[0]?.link || null;

//     return res.status(200).json({
//       title: recipe.title || q,
//       servings: recipe.servings || null,
//       readyInMinutes: recipe.readyInMinutes || null,
//       calories: recipe.calories || null,
//       ingredients: recipe.ingredients || [],
//       steps: recipe.steps || [],
//       image,
//     });
//   } catch (err: any) {
//     console.error("Recipe API error:", err);
//     return res.status(500).json({ error: err.message || "Server error" });
//   }
// }

// api/search.ts

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow requests from any origin (for dev)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Only POST requests allowed" });

    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is missing!");
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    console.log("Query received:", query);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful cooking assistant." },
          {
            role: "user",
            content: `Give me a recipe for ${query} in JSON format with ingredients, directions, calories, and servings.`,
          },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text)
      return res.status(500).json({ error: "No response from OpenAI" });

    let recipe;
    try {
      recipe = JSON.parse(text);
    } catch (err) {
      console.error("JSON parse error:", err, "Text:", text);
      const match = text.match(/\{[\s\S]*\}/);
      if (match) recipe = JSON.parse(match[0]);
      else
        return res
          .status(500)
          .json({ error: "Could not parse OpenAI response" });
    }

    res.status(200).json(recipe);
  } catch (err: any) {
    console.error("Serverless function error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
