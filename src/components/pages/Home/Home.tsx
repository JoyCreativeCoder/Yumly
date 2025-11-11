import "./Home.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Header/Header";
import { Search } from "lucide-react";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  const [mode, setMode] = useState("recipes");
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [meal, setMeal] = useState("");
  const [recipe, setRecipe] = useState<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const date = new Date();
    const hour = date.getHours();

    if (hour >= 5 && hour < 12) {
      setMeal("breakfast");
    } else if (hour >= 12 && hour < 17) {
      setMeal("lunch");
    } else {
      setMeal("dinner");
    }
  }, []);

  async function fetchRecipe(q: string) {
    const res = await fetch("/api/recipes/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HTTP error! Status: ${res.status}, Body: ${errBody}`);
    }
    return res.json();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setError("Type something");
      return;
    }

    setError("");
    setLoading(true);
    setHint("");

    try {
      const data = await fetchRecipe(q);
      // Validate that the recipe has minimal required fields
      const valid =
        data &&
        typeof data.title === "string" &&
        Array.isArray(data.ingredients) &&
        Array.isArray(data.steps) &&
        typeof data.servings === "number" &&
        typeof data.calories === "number";

      if (valid) {
        navigate("/recipe", { state: { recipe: data } });
      } else {
        setHint("No recipe found or invalid format. Try a simpler term.");
        console.warn("Invalid recipe data:", data);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <Header />
      <main className="home__content">
        <h1 className="hero_text">What are you making for {meal}?</h1>
        <div className="mode-toggle" role="tablist" aria-label="Search mode">
          <button
            className={`btn btn--chip ${
              mode === "recipes" ? "btn--active" : ""
            }`}
            role="tab"
            onClick={() => setMode("recipes")}
          >
            Recipes
          </button>
          <button
            className={`btn btn--chip ${
              mode === "ingredients" ? "btn--active" : ""
            }`}
            role="tab"
            onClick={() => setMode("ingredients")}
          >
            Ingredients
          </button>
        </div>

        <form className="search__form" role="search" onSubmit={handleSubmit}>
          <div className="input_container">
            <Search color="#8f97a3" className="search_icon" size="20" />
            <input
              className="search__input search__input--lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "recipes"
                  ? "Search specific recipes…"
                  : "Search by ingredients…"
              }
              aria-label="Search recipes"
            />
          </div>

          <button
            className="btn_getrecipe"
            type="submit"
            disabled={!query.trim() || loading}
            aria-busy={loading}
          >
            {loading ? <span className="spinner" aria-hidden /> : "Get Recipe"}
          </button>
        </form>
      </main>
    </div>
  );
}
