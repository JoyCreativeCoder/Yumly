import "./details.css";

export default function Details() {
  return (
    <main className="recipe" role="main">
      <section className="recipe__grid">
        {/* LEFT: hero image + chips */}
        <div className="recipe__left">
          <figure className="recipe__media">
            <img src="/images/creps.jpeg" alt="Crepes on plate" />
          </figure>

          <ul className="recipe__chips" aria-label="Recipe meta">
            <li className="chip">
              <span aria-hidden>⏱</span> 45 min
            </li>
            <li className="chip">
              <span aria-hidden>🍽</span> 4 servings
            </li>
            <li className="chip">
              <span aria-hidden>🔥</span> 520 kcal
            </li>
          </ul>
        </div>

        {/* RIGHT: title, tabs, list */}
        <div className="recipe__right">
          <h1 className="recipe__title">Pancakes</h1>

          <div
            className="recipe__tabs"
            role="tablist"
            aria-label="Recipe sections"
          >
            <button
              className="tabs__btn tabs__btn--active"
              role="tab"
              aria-selected="true"
              id="tab-ingredients"
              aria-controls="panel-ingredients"
            >
              Ingredients
            </button>
            <button
              className="tabs__btn"
              role="tab"
              aria-selected="false"
              id="tab-directions"
              aria-controls="panel-directions"
            >
              Directions
            </button>
          </div>

          <section
            className="recipe__panel"
            id="panel-ingredients"
            role="tabpanel"
            aria-labelledby="tab-ingredients"
          >
            <ul className="ingredients" role="list">
              <li className="ingredients__item">
                <input
                  className="ingredients__check"
                  type="checkbox"
                  id="ing-oil"
                />
                <label htmlFor="ing-oil">
                  <span className="ingredients__name">Vegetable Oil</span>
                  <span className="ingredients__qty">1 tbsp</span>
                </label>
              </li>

              <li className="ingredients__item">
                <input
                  className="ingredients__check"
                  type="checkbox"
                  id="ing-onion"
                />
                <label htmlFor="ing-onion">
                  <span className="ingredients__name">Medium Onion</span>
                  <span className="ingredients__qty">1</span>
                </label>
              </li>
            </ul>
          </section>

          <section
            className="recipe__panel is-hidden"
            id="panel-directions"
            role="tabpanel"
            aria-labelledby="tab-directions"
            hidden
          />

          <footer className="recipe__actions">
            <button className="action action--ghost" type="button">
              Copy list
            </button>
          </footer>
        </div>
      </section>

      {/* <footer className="recipe__actions">
        <button className="action action--ghost" type="button">
          Copy list
        </button>
      </footer> */}
    </main>
  );
}
