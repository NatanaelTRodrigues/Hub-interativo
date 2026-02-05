import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout
import MainLayout from "./components/layout/MainLayout";

// Páginas
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ArcadePage from "./pages/ArcadePage";
import StorePage from "./pages/StorePage"; // <--- Certifique-se que este arquivo existe!
import InventoryPage from "./pages/InventoryPage"; // <--- Certifique-se que este arquivo existe!
import AdminPage from "./pages/AdminPage";
// Jogos
import TicTacToeGame from "./games/TicTacToe/TicTacToeGame";
import ReactionTestGame from "./games/ReactionTest/ReactionTestGame";
import MemoryGame from "./games/MemoryGame/MemoryGame";
import PongGame from "./games/Pong/PongGame";
import WordSearchGame from "./games/WordSearch/WordSearchGame";
import SnakeGame from "./games/Snake/SnakeGame";
import ClickerGame from "./games/ClickerGame/ClickerGame";
import BrickBreakerGame from "./games/BrickBreaker/BrickBreakerGame";
import CommunityPage from "./pages/CommunityPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas SEM Header/Footer (Login) */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/cadastro" element={<AuthPage />} />

        {/* Rotas COM Header/Footer (Layout Principal) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/jogos" element={<ArcadePage />} />
          <Route path="/perfil" element={<ProfilePage />} />

          {/* --- AS ROTAS QUE ESTAVAM FALTANDO --- */}
          <Route path="/loja" element={<StorePage />} />
          <Route path="/inventario" element={<InventoryPage />} />

          {/* Rotas dos Jogos */}
          <Route path="/jogo/velha" element={<TicTacToeGame />} />
          <Route path="/jogo/reacao" element={<ReactionTestGame />} />
          <Route path="/jogo/memoria" element={<MemoryGame />} />
          <Route path="/jogo/pong" element={<PongGame />} />
          <Route path="/jogo/caca-palavras" element={<WordSearchGame />} />
          <Route path="/jogo/snake" element={<SnakeGame />} />
          <Route path="/jogo/clicker" element={<ClickerGame />} />
          <Route path="/jogo/quebra-blocos" element={<BrickBreakerGame />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/comunidade" element={<CommunityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
