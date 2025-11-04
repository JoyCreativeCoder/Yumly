import { Star } from "lucide-react";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <img src="/images/yumly.svg" alt="Yumly logo" />
      <div className="header__spacer" />
      <div className="actions">
        <a className="btn-feedback" href="writejoy.n@gmail.com">
          Send feedback
        </a>
        <Star color="#FF141B" strokeWidth={1.25} />
      </div>
    </header>
  );
}
