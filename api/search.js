export default async function handler(req, res) {
    try {
        const q = String(req.query.query || "").trim();
        if (!q)
            return res.status(400).json({ error: "Missing query" });
        const key = process.env.SPOONACULAR_KEY;
        if (!key)
            return res.status(500).json({ error: "Server API key missing" });
        const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
        url.search = new URLSearchParams({
            apiKey: key,
            query: q,
            number: "10",
            addRecipeInformation: "true",
            instructionsRequired: "true",
        }).toString();
        const r = await fetch(url);
        if (!r.ok) {
            const text = await r.text();
            return res
                .status(r.status)
                .json({ error: "Upstream error", details: text });
        }
        const data = await r.json();
        const results = (data.results || []).map((r) => ({
            id: r.id,
            title: r.title,
            image: r.image,
            readyInMinutes: r.readyInMinutes,
            servings: r.servings,
        }));
        res.status(200).json({ results });
    }
    catch (e) {
        res.status(500).json({ error: e?.message || "Server error" });
    }
}
