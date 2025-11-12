import React from "react";
import "./HomePage.css";
import { useApp } from "../contexts/AppContext"; // <-- 1. Importar o AppContext
import { Link } from "react-router-dom"; // <-- 2. Importar o Link

function HomePage() {
  // --- 3. Pegar os dados do usuário e a função de logout ---
  const { profile, session, logout } = useApp();

  let clickCount = 0;
  let lastClickTime = 0;

  const handleLogoClick = () => {
    // ... (lógica do clique triplo não muda) ...
    const now = new Date().getTime();
    if (now - lastClickTime < 500) clickCount++;
    else clickCount = 1;
    lastClickTime = now;
    if (clickCount >= 3) {
      alert("Acesso ADMIN liberado!");
      clickCount = 0;
    }
  };

  return (
    <div className="homepage-container">
      {/* ===== HEADER (ATUALIZADO) ===== */}
      <header className="header">
        <div className="logo" onClick={handleLogoClick}>
          MeuSiteDeJogos
        </div>
        <nav className="navbar">
          <Link to="/">Home</Link>
          <Link to="/jogos">Jogos</Link>

          {/* --- Lógica de Login/Logout --- */}
          {session ? (
            <>
              {/* Se está logado, mostra Perfil e Logout */}
              <Link to="/perfil">
                {profile ? profile.username : "Perfil"} {/* Mostra o nome! */}
              </Link>
              <a href="#" onClick={logout} className="logout-button">
                Sair
              </a>
            </>
          ) : (
            <>
              {/* Se não está logado, mostra Login */}
              <Link to="/login" className="login-button">
                Login
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* ===== O RESTO DA PÁGINA (sem mudança) ===== */}
      <section id="sobre" className="section section-sobre">
        <div className="content-box">
          <h2>Sobre Mim</h2>
          {/* ... (Seu texto sobre mim) ... */}
          <p>
            Meu nome é Natanael, tenho 20 anos e sou estudante do 4º semestre de
            <strong> Análise e Desenvolvimento de Sistemas (ADS)</strong>.
            Atualmente, atuo como estagiário na ANASPS, onde venho aplicando e
            expandindo meus conhecimentos práticos na área de desenvolvimento.
          </p>
          <p>
            Minha formação principal inclui um curso de
            <strong>
              {" "}
              Desenvolvimento de Sistemas de 1200 horas pelo SENAI
            </strong>
            , complementado por diversas qualificações em áreas como Front-End,
            Cyber Segurança, Design de Games e Arte Vetorial.
          </p>
          <p>
            Este site é um projeto pessoal que une minha paixão por tecnologia e
            entretenimento. Meu objetivo é criar uma plataforma interativa e
            divertida, utilizando este desenvolvimento como um campo de provas
            para aplicar e aprimorar minhas habilidades.
          </p>
        </div>
      </section>

      {/* ... (Seções "O que o Site Proporciona" e "Preview dos Jogos" não mudam) ... */}

      <footer className="footer">{/* ... (Footer não muda) ... */}</footer>
    </div>
  );
}

export default HomePage;
