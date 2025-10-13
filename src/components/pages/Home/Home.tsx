import "./Home.css";
import RecipeCard from "../../RecipeCard/RecipeCard";
import Header from "../../Header/Header";
import { recipes } from "@/data/recipes";

export default function Home() {
  const openRecipe = (id: number) => console.log("open", id);
  return (
    <>
      <Header />
      <main className="feed">
        <div className="recipe-grid">
          {recipes.map((r) => (
            <RecipeCard key={r.id} {...r} onOpen={openRecipe} />
          ))}
        </div>
      </main>
    </>
  );
}
