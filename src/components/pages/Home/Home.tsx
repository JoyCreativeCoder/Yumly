import "./Home.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Header/Header";

export default function Home() {
  const [mode, setMode] = useState("recipes");
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function fetchRecipe(q: string) {
    const res = await fetch(
      "/api/recipes/search?query=" + encodeURIComponent(q)
    );
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.json();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("submitted");
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
      if (data.id) {
        navigate("/recipe/" + data.id);
        console.log(data);
      } else {
        setHint(data.hint || "No result found. Try a simpler term.");
        console.log(data.hint);
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      // setQuery("");
    }
  };

  return (
    <div className="home">
      <Header />
      <main className="home__content">
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

        {/* <div className="search">
          <form className="search" onSubmit={handleSubmit}>
            <input
              className="search__input"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              type="search"
              placeholder={
                mode === "recipes"
                  ? "Search specific recipes..."
                  : "Search by ingredients..."
              }
              aria-label="Search recipes"
            />
          </form>
        </div> */}

        <form className="search__form" role="search" onSubmit={handleSubmit}>
          <input
            className="search__input search__input--lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder={
              mode === "recipes"
                ? "Search specific recipes…"
                : "Search by ingredients…"
            }
            aria-label="Search recipes"
          />
          <button
            className="btn_getrecipe"
            type="submit"
            disabled={!query.trim() || loading}
            aria-busy={loading}
          >
            {loading ? <span className="spinner" aria-hidden /> : "Get Recipe"}
          </button>
        </form>

        <ul className="chips" aria-label="Popular tags">
          <li>
            <button className="chip">Jollof</button>
          </li>
          <li>
            <button className="chip">potato + egg</button>
          </li>
          <li>
            <button className="chip">Pasta</button>
          </li>
          <li>
            <button className="chip">Chicken</button>
          </li>
          <li>
            <button className="chip">chicken, tomato, onion</button>
          </li>
        </ul>
      </main>
    </div>
  );
}
