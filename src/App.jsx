import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importe sua página principal
import HomePage from "./pages/HomePage";

// --- IMPORTAÇÃO DOS JOGOS ---
import TicTacToeGame from "./games/TicTacToe/TicTacToeGame";
import ReactionTestGame from "./games/ReactionTest/ReactionTestGame";
import MemoryGame from "./games/MemoryGame/MemoryGame";
import PongGame from "./games/Pong/PongGame";
import WordSearchGame from "./games/WordSearch/WordSearchGame";
import SnakeGame from "./games/Snake/SnakeGame";
import ClickerGame from "./games/ClickerGame/ClickerGame";
import BrickBreakerGame from "./games/BrickBreaker/BrickBreakerGame";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";

// CSS Global
import "./index.css";

// --- Placeholders para as outras páginas ---
const ArcadePage = () => (
  <div style={{ padding: "2rem" }}>
    <h1>Página de Jogos (Arcade)</h1>
    <p>Nossos Jogos:</p>
    <ul>
      <li>
        <a href="/jogo/velha">Jogar Jogo da Velha</a>
      </li>
      <li>
        <a href="/jogo/reacao">Jogar Teste de Reação</a>
      </li>
      <li>
        <a href="/jogo/memoria">Jogar Jogo da Memória</a>
      </li>
      <li>
        <a href="/jogo/pong">Jogar Pong</a>
      </li>
      <li>
        <a href="/jogo/caca-palavras">Jogar Caça-Palavras</a>
      </li>
      <li>
        <a href="/jogo/snake">Jogar Snake</a>
      </li>
      <li>
        <a href="/jogo/clicker">Jogar Teste de Cliques</a>
      </li>
      <li>
        <a href="/jogo/quebra-blocos">Jogar Quebra-Blocos</a>
      </li>{" "}
      {/* <-- Link temporário */}
    </ul>
  </div>
);
// --- Fim dos Placeholders ---

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- NOVAS ROTAS DE AUTH --- */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/cadastro" element={<AuthPage />} />
        {/* Rota 1: Página Principal */}
        <Route path="/" element={<HomePage />} />
        {/* Rota 2: Página de Jogos */}
        <Route path="/jogos" element={<ArcadePage />} />
        {/* Rota 3: Página de Perfil */}
        <Route path="/perfil" element={<ProfilePage />} />
        {/* --- ROTAS DOS JOGOS --- */}
        <Route path="/jogo/velha" element={<TicTacToeGame />} />
        <Route path="/jogo/reacao" element={<ReactionTestGame />} />
        <Route path="/jogo/memoria" element={<MemoryGame />} />
        <Route path="/jogo/pong" element={<PongGame />} />
        <Route path="/jogo/caca-palavras" element={<WordSearchGame />} />
        <Route path="/jogo/snake" element={<SnakeGame />} />
        <Route path="/jogo/clicker" element={<ClickerGame />} />
        <Route path="/jogo/quebra-blocos" element={<BrickBreakerGame />} />{" "}
        {/* <-- Adicione esta linha */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
