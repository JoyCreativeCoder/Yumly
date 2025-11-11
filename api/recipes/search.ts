// import type { VercelRequest, VercelResponse } from "@vercel/node";

// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");

//   if (req.method === "OPTIONS") return res.status(200).end();
//   if (req.method !== "POST")
//     return res.status(405).json({ error: "Only POST requests allowed" });

//   const { query } = req.body;
//   if (!query) return res.status(400).json({ error: "Missing query" });
//   if (!process.env.GEMINI_API_KEY)
//     return res.status(500).json({ error: "Missing Gemini API key" });

//   console.log("GEMINI_API_KEY loaded?", !!process.env.GEMINI_API_KEY);

//   try {
//     const prompt = `You are a professional chef AI. Generate a JSON recipe for "${query}". The JSON must include: title (string), ingredients (array of strings), steps (array of strings), servings (number), calories (number). Do not include any text outside the JSON. Use proper JSON formatting with double quotes.`;
//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/text-bison-001:generateText?key=${process.env.GEMINI_API_KEY}`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           prompt: prompt,
//           temperature: 0.5,
//           maxOutputTokens: 500,
//         }),
//       }
//     );

//     const data = await response.json();
//     console.log("Gemini raw response:", data);

//     const rawText = data.candidates?.[0]?.content || "";
//     if (!rawText)
//       return res.status(500).json({ error: "No response from Gemini" });

//     let recipe;
//     try {
//       recipe = JSON.parse(rawText);
//     } catch {
//       const match = rawText.match(/\{[\s\S]*\}/);
//       if (match) recipe = JSON.parse(match[0]);
//       else return res.status(500).json({ error: "Invalid recipe format" });
//     }

//     recipe.ingredients ||= [];
//     recipe.steps ||= [];
//     recipe.servings ||= 1;
//     recipe.calories ||= 0;

//     res.status(200).json(recipe);
//   } catch (err: any) {
//     console.error("Serverless function error:", err);
//     res.status(500).json({ error: err.message || "Internal server error" });
//   }
// }

// /api/recipe-generator.ts or index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
// Import the new SDK components
import { GoogleGenAI, Type, Schema } from "@google/genai";

// 1. Define the Schema for guaranteed JSON structure
const RECIPE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "The official name of the recipe.",
    },
    ingredients: {
      type: Type.ARRAY,
      description:
        'A list of all ingredients as formatted strings (e.g., "4 cups Parboiled Long-Grain Rice").',
      items: { type: Type.STRING },
    },
    steps: {
      type: Type.ARRAY,
      description:
        "A list of cooking instructions, where each item is a single step.",
      items: { type: Type.STRING },
    },
    servings: {
      type: Type.NUMBER,
      description: "The number of people the recipe serves.",
    },
    calories: {
      type: Type.NUMBER,
      description: "An estimated calorie count per serving.",
    },
  },
  required: ["title", "ingredients", "steps", "servings"],
};

// Initialize the SDK outside the handler for better performance
// It automatically picks up GEMINI_API_KEY from environment variables
const ai = new GoogleGenAI({});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers (Good job keeping these)
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

  console.log("GEMINI_API_KEY loaded?", !!process.env.GEMINI_API_KEY);

  try {
    // 2. Simple, direct prompt
    const prompt = `Generate a complete recipe for "${query}". You are a professional chef.`;

    // 3. Use generateContent with Structured Output Configuration
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // The powerful, fast, and modern model
      contents: prompt,
      config: {
        // CRITICAL FIX: Forces the output to be valid JSON
        responseMimeType: "application/json",
        // CRITICAL FIX: Enforces the structure defined above
        responseSchema: RECIPE_SCHEMA,
        temperature: 0.5,
      },
    });

    // 4. Clean and Parse the JSON
    // The response.text is guaranteed to be a JSON string that matches the schema
    const rawText = response.text.trim();

    // Safely parse the JSON
    let recipe;
    try {
      recipe = JSON.parse(rawText);
    } catch (parseError) {
      console.error("JSON Parsing Error:", parseError);
      // In case of a rare parsing issue, we return a 500
      return res
        .status(500)
        .json({ error: "Could not parse structured recipe output." });
    }

    // 5. Success
    // No need for default value checks (||=) as the schema forces these fields to be present.
    res.status(200).json(recipe);
  } catch (err: any) {
    console.error("Serverless function error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
