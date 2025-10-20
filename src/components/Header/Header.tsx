import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header__spacer" />
      <h1 className="title">Yumly</h1>

      <div className="actions">
        <a
          className="btn-feedback"
          href="mailto:yumly.feedback@example.com?subject=Yumly%20Feedback&body=Tell%20us%20what%20you%20think%20👇"
        >
          Send feedback
        </a>
      </div>
    </header>
  );
}
