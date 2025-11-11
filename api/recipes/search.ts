import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST requests allowed" });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });
  if (!process.env.GEMINI_API_KEY)
    return res.status(500).json({ error: "Missing Gemini API key" });

  try {
    const prompt = `
      You are a professional chef AI.
      Generate a JSON recipe for "${query}".
      The JSON must include:
        - title: string
        - ingredients: array of strings
        - steps: array of strings
        - servings: number
        - calories: number
      Do not include any text outside the JSON.
      Use proper JSON formatting with double quotes.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          temperature: 0.5,
          maxOutputTokens: 500,
        }),
      }
    );

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText)
      return res.status(500).json({ error: "No response from Gemini" });

    // Try parsing JSON safely
    let recipe;
    try {
      recipe = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) recipe = JSON.parse(match[0]);
      else return res.status(500).json({ error: "Invalid recipe format" });
    }

    // Ensure default values
    recipe.ingredients ||= [];
    recipe.steps ||= [];
    recipe.servings ||= 1;
    recipe.calories ||= 0;

    res.status(200).json(recipe);
  } catch (err: any) {
    console.error("Serverless function error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
