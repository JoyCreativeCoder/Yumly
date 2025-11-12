import { ArrowLeft } from "lucide-react";
import "./Header.css";
import { useNavigate } from "react-router-dom";

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
      </div>
    </header>
  );
}

export function Header1({ title }: Header1Props) {
  const navigate = useNavigate();

  const goback = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="header-one">
      <div className="header-one-container">
        <button className="go-back" onClick={goback}>
          <ArrowLeft />
        </button>
        {title ? (
          <h1>{title}</h1>
        ) : (
          <img src="/images/yumly.svg" alt="Yumly logo" className="logo" />
        )}
        <div className="actions">
          <a className="btn-feedback" href="mailto:writejoy.n@gmail.com">
            Send feedback
          </a>
        </div>
      </div>
    </header>
  );
}
