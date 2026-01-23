import React from "react";
import { Link } from "react-router-dom";
import "./ArcadePage.css"; // Vamos criar este CSS

const ArcadePage = () => {
  return (
    <div className="arcade-page-container">
      <h1 className="arcade-title">Arcade de Jogos</h1>
      <p className="arcade-subtitle">Escolha um jogo para começar!</p>

      {/* Grid com todos os jogos clicáveis */}
      <div className="game-grid">
        <Link to="/jogo/pong" className="game-card">
          <span className="game-card-icon">🏓</span>
          <h3>Pong</h3>
          <p>O clássico de Tênis em 2D.</p>
        </Link>

        <Link to="/jogo/caca-palavras" className="game-card">
          <span className="game-card-icon">🔡</span>
          <h3>Caça-Palavras</h3>
          <p>Encontre as palavras escondidas.</p>
        </Link>

        <Link to="/jogo/velha" className="game-card">
          <span className="game-card-icon">#️⃣</span>
          <h3>Jogo da Velha</h3>
          <p>Vença o bot "impossível".</p>
        </Link>

        <Link to="/jogo/memoria" className="game-card">
          <span className="game-card-icon">🧠</span>
          <h3>Jogo da Memória</h3>
          <p>Teste sua memória com emojis.</p>
        </Link>

        <Link to="/jogo/reacao" className="game-card">
          <span className="game-card-icon">⚡</span>
          <h3>Teste de Reação</h3>
          <p>Quão rápido é o seu clique?</p>
        </Link>

        <Link to="/jogo/snake" className="game-card">
          <span className="game-card-icon">🐍</span>
          <h3>Snake</h3>
          <p>A clássica cobrinha.</p>
        </Link>

        <Link to="/jogo/quebra-blocos" className="game-card">
          <span className="game-card-icon">🧱</span>
          <h3>Quebra-Blocos</h3>
          <p>Destrua todos os blocos.</p>
        </Link>

        <Link to="/jogo/clicker" className="game-card">
          <span className="game-card-icon">🖱️</span>
          <h3>Teste de Cliques</h3>
          <p>Quantos cliques em 5s?</p>
        </Link>
      </div>
    </div>
  );
};

export default ArcadePage;
