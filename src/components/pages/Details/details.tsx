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
  // These fields are not provided by your current Gemini schema,
  // but we keep them here for display compatibility if you add them later.
  image?: string;
  readyInMinutes?: number | null;
};

export default function Details() {
  const location = useLocation();
  const navigate = useNavigate();

  const recipeFromState = location.state?.recipe;
  const normalizedRecipe: Recipe | null = recipeFromState
    ? {
        title: recipeFromState.title || "Generated Recipe",
        servings: recipeFromState.servings || null,
        calories: recipeFromState.calories || null,
        ingredients: recipeFromState.calories || [],
        steps: recipeFromState.steps || [],
        readyInMinutes: null,
        image: undefined,
      }
    : null;

  const [data, setData] = useState<Recipe | null>(normalizedRecipe);
  const [detailsMode, setDetailsMode] = useState<"Ingredients" | "Directions">(
    "Ingredients"
  );
  const [error, setError] = useState<string | null>(null);

  const goback = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    // Check if the component was loaded without any recipe data
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
          {data.image ? (
            <img
              src={data.image}
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
            <section className="recipe__panel">
              <ul className="ingredients" role="list">
                {(data.ingredients ?? []).map((ingredient, i) => (
                  <li className="ingredients__item" key={i}>
                    <input
                      className="ingredients__check"
                      type="checkbox"
                      id={`ing-${i}`}
                    />
                    <label htmlFor={`ing-${i}`}>
                      <span className="ingredients__name">{ingredient}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {detailsMode === "Directions" && (
            <section className="recipe__panel">
              <ol className="steps" role="list">
                {(data.steps ?? []).map((step, i) => (
                  <li className="steps__item" key={i}>
                    <div className="steps__card">
                      <p className="steps__text">{step}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {detailsMode === "Ingredients" &&
            (data.ingredients?.length ?? 0) > 0 && (
              <footer className="recipe__actions">
                <button className="action action--ghost" type="button">
                  <Copy strokeWidth={2} />
                  Copy list
                </button>
              </footer>
            )}
        </div>
      </div>
    </main>
  );
}
