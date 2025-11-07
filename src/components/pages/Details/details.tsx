import "./details.css";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AlarmClock, Copy, Flame, Utensils } from "lucide-react";
import Header, { Header1 } from "@/components/Header/Header";

// type Ingredient = { name: string; amount?: number; unit?: string };
type Recipe = {
  title: string;
  image?: string;
  servings?: number | null;
  readyInMinutes?: number | null;
  calories?: number | null;
  ingredients?: string[];
  instructions?: string;
};

export default function Details() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [data, setData] = useState<Recipe | null>(
    location.state?.recipe || null
  );
  const [detailsMode, setDetailsMode] = useState("Ingredients");
  const [error, setError] = useState<string | null>(null);

  const handleDetailsMode = (mode: string) => {
    setDetailsMode(mode);
  };

  const navigate = useNavigate();

  const goback = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    if (data) return; // we already have data from state

    if (!id) {
      setError("No recipe data available. Please search again.");
      return;
    }

    // if you later add support for saved recipes or persistent fetching, handle here
    (async () => {
      try {
        const res = await fetch(
          `/api/recipes/search?query=${encodeURIComponent(id)}`
        );
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    })();
  }, [id, data]);

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading recipe...</p>;

  console.log("RES", data);

  return (
    <main className="recipe" role="main">
      <Header1 title={data?.title} />
      {error && <p>Error: {error}</p>}

      {data && (
        <div className="container">
          {/* <button
            type="button"
            className="go-back"
            onClick={goback}
            aria-label="Go back"
          >
            <MoveLeft size={36} strokeWidth={1} aria-hidden="true" />
          </button> */}
          <div className="food-hero">
            <img
              src={data.image}
              decoding="async"
              alt={data.title ? `${data.title} — plated` : "Recipe image"}
              loading="lazy"
            />
            <div className="food-title">
              <h1 className="text-title">{data.title}</h1>
              <button className="link">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="35"
                  height="35"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2b2b2b"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="lucide lucide-link2-icon lucide-link-2"
                >
                  <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                  <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
                  <line x1="8" x2="16" y1="12" y2="12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="food-details">
            <ul className="recipe__chips" aria-label="Recipe meta">
              <li className="chip">
                <span aria-hidden>
                  <AlarmClock size={24} strokeWidth={2} className="icon" />
                </span>{" "}
                {data.readyInMinutes} min
              </li>
              <li className="chip">
                <span aria-hidden>
                  <Utensils size={24} strokeWidth={2} className="icon" />
                </span>{" "}
                {data.servings} servings
              </li>
              <li className="chip">
                <span aria-hidden>
                  <Flame size={24} strokeWidth={2} className="icon" />
                </span>{" "}
                {data.calories} kcal
              </li>
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
                aria-selected="true"
                id="tab-ingredients"
                aria-controls="panel-ingredients"
                onClick={() => handleDetailsMode("Ingredients")}
              >
                Ingredients
              </button>
              <button
                className={`tabs__btn ${
                  detailsMode === "Directions" ? "tabs__btn--active" : ""
                }`}
                role="tab"
                aria-selected="false"
                id="tab-directions"
                aria-controls="panel-directions"
                onClick={() => handleDetailsMode("Directions")}
              >
                Directions
              </button>
            </div>

            {detailsMode === "Ingredients" && (
              <section
                className="recipe__panel"
                id="panel-ingredients"
                role="tabpanel"
                aria-labelledby="tab-ingredients"
              >
                <ul className="ingredients" role="list">
                  {(data.ingredients ?? []).map((ingredient, i) => {
                    const checkboxId = `ing-${i}`;
                    return (
                      <li className="ingredients__item" key={checkboxId}>
                        <input
                          className="ingredients__check"
                          type="checkbox"
                          id={checkboxId}
                        />
                        <label htmlFor={checkboxId}>
                          <span className="ingredients__name">
                            {ingredient}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {detailsMode === "Directions" && (
              <section
                className="recipe__panel"
                id="panel-directions"
                role="tabpanel"
                aria-labelledby="tab-directions"
              >
                <ol className="steps" role="list">
                  {(data.instructions ?? "")
                    .split(/\n|\.\s+/) // split by newlines or sentence endings
                    .filter(Boolean)
                    .map((step, i) => (
                      <li className="steps__item" key={i}>
                        <div className="steps__card">
                          <p className="steps__text">{step}</p>
                        </div>
                      </li>
                    ))}
                </ol>
              </section>
            )}

            {detailsMode === "Ingredients" && (
              <footer className="recipe__actions">
                <button className="action action--ghost" type="button">
                  <Copy strokeWidth={2} />
                  Copy list
                </button>
              </footer>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
