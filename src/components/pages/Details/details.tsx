import "./details.css";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

type Ingredient = { name: string; amount?: number; unit?: string };
type Recipe = {
  steps?: string[];
  title?: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  calories?: number;
  ingredients?: Ingredient[];
};

export default function Details() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Recipe | null>(null);
  const [detailsMode, setDetailsMode] = useState("Ingredient");
  const [error, setError] = useState<string | null>(null);

  const handleDetailsMode = (mode: "Ingredients" | "Directions") => {
    setDetailsMode(mode);
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    })();
  }, [id]);

  console.log("RES", data);

  return (
    <main className="recipe" role="main">
      {error && <p>Error: {error}</p>}

      {!error && !data && (
        <section className="recipe__grid">
          <div className="recipe__left">
            <figure className="recipe__media u-skeleton" />
            <ul className="recipe__chips u-skeleton" />
          </div>
          <div className="recipe__right">
            <h1 className="recipe__title u-skeleton">Loading…</h1>
            <div className="recipe__tabs u-skeleton" />
            <ul className="ingredients">
              <li className="ingredients__item u-skeleton" />
              <li className="ingredients__item u-skeleton" />
              <li className="ingredients__item u-skeleton" />
            </ul>
          </div>
        </section>
      )}

      {data && (
        <section className="recipe__grid">
          <div className="recipe__left">
            <figure className="recipe__media">
              <img
                src={data.image}
                decoding="async"
                alt={data.title ? `${data.title} — plated` : "Recipe image"}
                loading="lazy"
              />
            </figure>

            <ul className="recipe__chips" aria-label="Recipe meta">
              <li className="chip">
                <span aria-hidden>⏱</span> {data.readyInMinutes} min
              </li>
              <li className="chip">
                <span aria-hidden>🍽</span> {data.servings} servings
              </li>
              <li className="chip">
                <span aria-hidden>🔥</span> {data.calories} kcal
              </li>
            </ul>
          </div>

          <div className="recipe__right">
            <h1 className="recipe__title">{data.title}</h1>
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
                  {(data?.ingredients ?? []).map((ing, i) => {
                    const checkboxId = `ing-${i}`;
                    const qty = [ing.amount, ing.unit]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <li className="ingredients__item" key={checkboxId}>
                        <input
                          className="ingredients__check"
                          type="checkbox"
                          id={checkboxId}
                        />
                        <label htmlFor={checkboxId}>
                          <span className="ingredients__name">{ing.name}</span>
                          {qty && (
                            <span className="ingredients__qty">{qty}</span>
                          )}
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
                  {(data.steps ?? []).map((text, i) => (
                    <li className="steps__item" key={i}>
                      <div className="steps__card">
                        <p className="steps__text">{text}</p>
                        <div className="steps__actions">
                          {/* optional: only render when you detect a duration */}
                          {/* <button className="btn btn--ghost btn--compact">⏱ Start 15 min timer</button> */}
                          {/* optional timestamp chip */}
                          {/* <span className="chip chip--mono">03:21</span> */}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {detailsMode === "Ingredients" && (
              <footer className="recipe__actions">
                <button className="action action--ghost" type="button">
                  Copy list
                </button>
              </footer>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
