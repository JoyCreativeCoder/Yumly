import type { VercelRequest, VercelResponse } from "@vercel/node";
// Import the new SDK components
import { GoogleGenAI, Type, Schema } from "@google/genai";

// 1. This Defines the Schema for guaranteed JSON structure(it heleps us to ensure that our ai returns response in the exact specified structure)
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

const ai = new GoogleGenAI({}); // this is the client that will communicate with Gemini API(we can get access to diffrent functionality)

const GOOGLE_SEARCH_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CX_ID = process.env.GOOGLE_CX_ID;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST requests allowed" });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });
  if (!process.env.GEMINI_API_KEY)
    return res.status(500).json({ error: "Missing Gemini API key" });

  try {
    const prompt = `Generate a complete recipe for "${query}". You are a professional chef. Ensure you include the total preparation and cooking time in minutes.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA,
        temperature: 0.5,
      },
    });

    console.log("GEMINI_RES", response);

    const rawText = response.text.trim();

    let recipe;
    try {
      recipe = JSON.parse(rawText);
    } catch (parseError) {
      console.error("JSON Parsing Error:", parseError);
      return res
        .status(500)
        .json({ error: "Could not parse structured recipe output." });
    }

    // >>>>>>>>>>>>>>>>>>>>Getting recipe image from google<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

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
        console.error("Image search failed, continuing without image:", error);
      }
    } else {
      console.warn("Skipping image search: Missing API keys or recipe title.");
    }

    const finalRecipeData = {
      ...recipe,
      imageUrl: imageUrl,
    };

    res.status(200).json(finalRecipeData);
  } catch (err: any) {
    console.error("Serverless function error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
