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
    readyInMinutes: {
      type: Type.NUMBER,
      description:
        "The estimated total time in minutes required to prepare and cook the recipe.",
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

const GOOGLE_SEARCH_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CX_ID = process.env.GOOGLE_CX_ID;
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
    const prompt = `Generate a complete recipe for "${query}". You are a professional chef. Ensure you include the total preparation and cooking time in minutes.`;

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

    let imageUrl: string | null = null;
    const recipeTitle = recipe.title;

    if (GOOGLE_SEARCH_API_KEY && GOOGLE_CX_ID && recipeTitle) {
      try {
        const searchUrl =
          `https://www.googleapis.com/customsearch/v1?` +
          `key=${GOOGLE_SEARCH_API_KEY}&` +
          `cx=${GOOGLE_CX_ID}&` +
          `q=delicious photo of ${encodeURIComponent(recipeTitle)}&` +
          `searchType=image&` +
          `num=1`;

        const imageResponse = await fetch(searchUrl);
        const searchData = await imageResponse.json();

        if (searchData.items && searchData.items.length > 0) {
          imageUrl = searchData.items[0].link;
        }
      } catch (error) {
        // Log image search error, but don't crash the whole function
        console.error("Image search failed, continuing without image:", error);
      }
    } else {
      console.warn("Skipping image search: Missing API keys or recipe title.");
    }

    const finalRecipeData = {
      ...recipe,
      imageUrl: imageUrl,
    };

    // 5. Success
    // No need for default value checks (||=) as the schema forces these fields to be present.
    res.status(200).json(finalRecipeData);
  } catch (err: any) {
    console.error("Serverless function error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
