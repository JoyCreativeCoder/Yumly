import type { VercelRequest, VercelResponse } from "@vercel/node";
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

    youtubeUrl: {
      type: Type.STRING,
      description:
        "A YouTube URL for a highly-rated recipe video related to the dish.",
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
    const prompt = `
You are an expert chef and recipe validator. Your final output must be a single, valid JSON object following the required schema.

The user typed: "${query}"

Your tasks:

1. First, determine if the user input refers to a real food item, recipe name, ingredient, or dish name.
    Examples of INVALID inputs:
    - symbols (^^, !!!, @@@)
    - nonsense strings (asdf, 123abc, xxxxx)
    - unrelated concepts (cars, phones, cities)
    - empty or meaningless words

2. If the input is NOT related to food or cooking:
    Respond EXACTLY with this JSON:
    {"error": "INVALID_QUERY"}

3. If the input IS a food item or recipe name:
    a. **Generate the recipe** following the required JSON schema.
    b. **Find the URL for the most popular and relevant YouTube recipe video** based on the recipe title.
    c. **DO NOT** add any extra fields. **Fill in all required schema fields, including the video link field.**
    d. Ensure the recipe is real, meaningful, and follows normal cooking logic.
`;

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
      console.log("THE RECIPE", recipe);
    } catch (parseError) {
      console.error("JSON Parsing Error:", parseError);
      return res
        .status(500)
        .json({ error: "Could not parse structured recipe output." });
    }

    if (recipe.title === "INVALID_QUERY") {
      console.log("INVALID");
      return res.status(400).json({
        error: "Please enter a valid food item.",
      });
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
