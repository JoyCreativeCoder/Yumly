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
    console.log("OPENAI_API_KEY loaded?", !!process.env.OPENAI_API_KEY);

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
    console.log("OpenAI response status:", response.status);

    const data = await response.json();
    console.log("OpenAI raw response:", data);
    const text = data?.choices?.[0]?.message?.content;
    console.log("API RES", data.choices?.[0].message.content);

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
