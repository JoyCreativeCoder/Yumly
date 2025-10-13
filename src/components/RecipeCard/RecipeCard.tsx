import "./RecipeCard.css";

type RecipeCardProps = {
  id: number;
  title: string;
  image: string;
  rating: number;
  time: number;
  onOpen: (id: number) => void;
};

export default function RecipeCard({
  id,
  title,
  image,
  rating,
  time,
  onOpen,
}: RecipeCardProps) {
  return (
    <>
      <div
        className="recipe-card"
        aria-label={`${title}, ${time} minutes, rated ${rating} stars`}
      >
        <div className="recipe-card__media">
          <img src={image} alt={title} loading="lazy" />
        </div>

        <div className="recipe-card__body">
          <h3 className="recipe-card__title">{title}</h3>
          <div className="recipe-card__meta">
            <span>{time} min</span>
            <span className="dot">•</span>
            <span>⭐ {rating}</span>
          </div>
        </div>
      </div>
    </>
  );
}
