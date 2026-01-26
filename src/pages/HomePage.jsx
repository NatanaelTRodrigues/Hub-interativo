import React from "react";
import "./HomePage.css";
import { Link } from "react-router-dom"; // Precisamos do Link para o botão "Ver Todos"

function HomePage() {
  return (
    <div className="homepage-container">
      {/* O HEADER FOI REMOVIDO DAQUI */}

      {/* ===== SEÇÃO SOBRE MIM ===== */}
      <section id="sobre" className="section section-sobre">
        <div className="content-box">
          <h2>Sobre Mim</h2>
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

      {/* ===== SEÇÃO O QUE O SITE PROPORCIONA ===== */}
      <section id="site" className="section section-site">
        <div className="content-box">
          <h2>O que o Site Proporciona?</h2>
          <p>
            Bem-vindo ao meu arcade pessoal! Este site foi criado para ser um
            hub de mini-games clássicos e divertidos. Aqui, você pode:
          </p>
          <ul>
            <li>Jogar 8 jogos viciantes, do Pong ao Snake.</li>
            <li>
              Competir contra o computador em diferentes níveis de dificuldade.
            </li>
            <li>
              Ganhar "Moedas do Site" ao completar desafios e vencer partidas.
            </li>
            <li>
              Usar suas moedas para customizar seu perfil com bordas, cursores e
              fotos exclusivas.
            </li>
          </ul>
        </div>
      </section>

      {/* ===== SEÇÃO "PREVIEW" DOS JOGOS ===== */}
      <section id="jogos" className="section section-jogos">
        <h2>Nossos Jogos</h2>
        <div className="game-grid">
          {/* Este grid na Home é apenas visual, não são links */}
          <div className="game-card-preview">Pong</div>
          <div className="game-card-preview">Caça-Palavras</div>
          <div className="game-card-preview">Jogo da Velha</div>
          <div className="game-card-preview">Jogo da Memória</div>
          <div className="game-card-preview">Teste de Reação</div>
          <div className="game-card-preview">Snake</div>
          <div className="game-card-preview">Quebra-Blocos</div>
          <div className="game-card-preview">Clicker</div>
        </div>
        <Link to="/jogos" className="btn-cta">
          Ver Todos os Jogos
        </Link>
      </section>

    </div>
  );
}

export default HomePage;
