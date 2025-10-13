import "./Header.css";

export default function Header() {
  return (
    <>
      <header className="header">
        <h1 className="title">Yumly</h1>
        <div className="search">
          <input
            type="search"
            placeholder="what are you making..."
            aria-label="Search recipes"
          />
        </div>
        <div className="actions">
          {/* favorite icon */}
          {/* shopping list icon  */}
        </div>
      </header>
    </>
  );
}
