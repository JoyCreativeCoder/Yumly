import "./Home.css";
import { useState } from "react";
// import RecipeCard from "../../RecipeCard/RecipeCard";
import Header from "../../Header/Header";
// import { recipes } from "@/data/recipes";

export default function Home() {
  const [mode, setMode] = useState("recipes");
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

        <div className="search">
          <input
            className="search__input"
            type="search"
            placeholder={
              mode === "recipes"
                ? "Search specific recipes..."
                : "Search by ingredients..."
            }
            aria-label="Search recipes"
          />
        </div>

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
