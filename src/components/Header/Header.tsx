import { Star } from "lucide-react";
import "./Header.css";

type Header1Props = {
  title?: string;
};

export default function Header() {
  return (
    <header className="header">
      <img src="/images/yumly.svg" alt="Yumly logo" className="logo" />
      <div className="header__spacer" />
      <div className="actions">
        <a className="btn-feedback" href="mailto:writejoy.n@gmail.com">
          Send feedback
        </a>

        <Star color="#FF141B" strokeWidth={1.25} className="favorite" />
      </div>
    </header>
  );
}

export function Header1({ title }: Header1Props) {
  return (
    <header className="header">
      {title ? (
        <h1>{title}</h1>
      ) : (
        <img src="/images/yumly.svg" alt="Yumly logo" className="logo" />
      )}
    </header>
  );
}
