import "./Home.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Header/Header";
import Modal from "../../Modal/modal";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [mode, setMode] = useState("recipes");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [meal, setMeal] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [errorType, setErrorType] = useState<"invalid" | "server" | null>(null);

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

    const data = await res.json();
    console.log("DATA", data);

    if (!res.ok && res.status !== 400) {
      const errorMessage =
        data.error || `Server responded with status ${res.status}`;
      throw new Error(errorMessage);
    }
    return { status: res.status, data };
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
    setIsDone(false);
    setShowModal(true);

    try {
      const { status, data } = await fetchRecipe(q);

      if (status === 400 && data.error) {
        setErrorType("invalid");
        setError(
          `"${q}" doesn't appear to be food-related. Please try searching for a recipe or dish name`
        );
        setLoading(false);
        setIsDone(true);
        setShowModal(true);
        return;
      }
      const valid =
        data &&
        typeof data.title === "string" &&
        Array.isArray(data.ingredients) &&
        Array.isArray(data.steps) &&
        typeof data.servings === "number" &&
        typeof data.calories === "number";

      if (valid) {
        setIsDone(true);
        setShowModal(false);
        navigate("/recipe", { state: { recipe: data } });
      }
    } catch (err: any) {
      setIsDone(true);
      setErrorType("server");
      if (err.message.includes("overloaded") || err.message.includes("quota")) {
        setError("Our AI is currently busy. Please try again in a moment.");
      } else if (err.message.includes("parse")) {
        setError("Something went wrong preparing the recipe. Please retry.");
      } else {
        setError("Unexpected error. Please try again.");
      }
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <Header />
      {showModal && (
        <Modal
          onCancel={() => setShowModal(false)}
          isDone={isDone}
          errorMessage={error}
          errorType={errorType}
        />
      )}
      <main className="home__content">
        <motion.h1
          className="hero_text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          What are you making for {meal}?
        </motion.h1>
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
            Get Recipe
          </button>
        </form>
      </main>
    </div>
  );
}
