import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__content">
        <img src="/images/yumly.svg" alt="Yumly logo" className="footer-logo" />
        <p className="footer__text">
          © {currentYear} Yumly. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
