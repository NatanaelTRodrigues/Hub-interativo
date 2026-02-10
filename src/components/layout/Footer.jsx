import React from "react";
import "./Footer.css"; // Vamos criar este CSS

const Footer = () => {
  return (
    <footer className="footer">
      <p>Desenvolvido por Natanael Rodrigues</p>
      <div className="social-links">
        <a
          href="https://github.com/NatanaelTRodrigues"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          href="https://www.instagram.com/Natas_mvp"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram
        </a>
      </div>
    </footer>
  );
};

export default Footer;
