import "./details.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AlarmClock, Copy, Flame, Utensils } from "lucide-react";
import { Header1 } from "@/components/Header/Header";

type Recipe = {
  title: string;
  servings: number | null;
  calories: number | null;
  ingredients: string[];
  steps: string[];
  imageUrl?: string;
  readyInMinutes?: number | null;
};

export default function Details() {
  const location = useLocation();
  const [showCopied, setShowCopied] = useState(false);

  const fallBackImage = "/images/ofada.jpeg";

  const recipeFromState = location.state?.recipe; //we are getting the recipe data from the navigation
  const normalizedRecipe: Recipe | null = recipeFromState
    ? {
        title: recipeFromState.title || "Generated Recipe",
        servings: recipeFromState.servings || null,
        calories: recipeFromState.calories || null,
        ingredients: Array.isArray(recipeFromState.ingredients)
          ? recipeFromState.ingredients
          : [],
        steps: Array.isArray(recipeFromState.steps)
          ? recipeFromState.steps
          : [],
        readyInMinutes: recipeFromState.readyInMinutes || null,
        imageUrl: recipeFromState.imageUrl || fallBackImage,
      }
    : null;

  const [data, setData] = useState<Recipe | null>(normalizedRecipe);
  const [detailsMode, setDetailsMode] = useState<"Ingredients" | "Directions">(
    "Ingredients"
  );
  const [error, setError] = useState<string | null>(null);

  const copyIngredients = async () => {
    if (!data || data.ingredients.length === 0) {
      console.warn("No ingredients to copy.");
      return;
    }

    const listString = data.ingredients.join("\n");
    try {
      await navigator.clipboard.writeText(listString);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      alert("Could not copy list. Please try manually.");
    }
  };

  useEffect(() => {
    if (!data) {
      setError("No recipe data available. Go back and search again.");
    }
  }, []);

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading recipe...</p>;

  return (
    <main className="recipe" role="main">
      <Header1 title={data.title} />
      <div className="container">
        <div className="food-hero">
          {data.imageUrl ? (
            <img
              src={data.imageUrl}
              decoding="async"
              alt={data.title ? `${data.title} — plated` : "Recipe image"}
              loading="lazy"
            />
          ) : (
            <div className="image-placeholder">No image available</div>
          )}
          <div className="food-title">
            <h1 className="text-title">{data.title}</h1>
          </div>
        </div>

        <div className="food-details">
          <ul className="recipe__chips" aria-label="Recipe meta">
            {data.readyInMinutes != null && (
              <li className="chip">
                <AlarmClock size={24} strokeWidth={2} className="icon" />{" "}
                {data.readyInMinutes} min
              </li>
            )}
            {data.servings != null && (
              <li className="chip">
                <Utensils size={24} strokeWidth={2} className="icon" />{" "}
                {data.servings} servings
              </li>
            )}
            {data.calories != null && (
              <li className="chip">
                <Flame size={24} strokeWidth={2} className="icon" />{" "}
                {data.calories} kcal
              </li>
            )}
          </ul>
        </div>

        <div className="recipe__bottom">
          <div
            className="recipe__tabs"
            role="tablist"
            aria-label="Recipe sections"
          >
            <button
              className={`tabs__btn ${
                detailsMode === "Ingredients" ? "tabs__btn--active" : ""
              }`}
              role="tab"
              onClick={() => setDetailsMode("Ingredients")}
            >
              Ingredients
            </button>
            <button
              className={`tabs__btn ${
                detailsMode === "Directions" ? "tabs__btn--active" : ""
              }`}
              role="tab"
              onClick={() => setDetailsMode("Directions")}
            >
              Directions
            </button>
          </div>

          {detailsMode === "Ingredients" && (
            <section className="ingedient__panel">
              <ul className="ingredients" role="list">
                {(data.ingredients ?? []).map((ingredient, i) => (
                  <li className="ingredients__item" key={i}>
                    <label htmlFor={`ing-${i}`}>
                      <span className="ingredients__name">{ingredient}</span>
                    </label>
                    <input
                      className="ingredients__check"
                      type="checkbox"
                      id={`ing-${i}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {detailsMode === "Directions" && (
            <section className="direction__panel">
              {(data.steps ?? []).map((step, i) => (
                <li className="steps__item" key={i}>
                  <div className="steps__card">
                    <div className="step-header">
                      <h1>step {i + 1}</h1>
                    </div>
                    <p className="steps__text">{step}</p>
                  </div>
                </li>
              ))}
            </section>
          )}

          {detailsMode === "Ingredients" &&
            (data.ingredients?.length ?? 0) > 0 && (
              <footer className="recipe__actions">
                <button
                  className="action"
                  type="button"
                  onClick={copyIngredients}
                >
                  <Copy strokeWidth={2} />
                  Copy list
                </button>
                {showCopied && <div className="copied-popup">Copied !</div>}
              </footer>
            )}
        </div>
      </div>
    </main>
  );
}
