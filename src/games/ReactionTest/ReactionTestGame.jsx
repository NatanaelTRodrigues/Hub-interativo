import React, { useState, useRef } from "react";
import "./ReactionTest.css";
import { useApp } from "../../contexts/AppContext";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

const ReactionTestGame = () => {
  const navigate = useNavigate();
  const { userCoins, addCoins, profile } = useApp();

  // Estados
  const [gameState, setGameState] = useState("waiting"); // waiting, ready, go, result
  const [reactionTime, setReactionTime] = useState(0);
  const [message, setMessage] = useState("Clique para começar");
  const [scores, setScores] = useState([]);

  // Resultados da rodada atual
  const [coinChange, setCoinChange] = useState(0);
  const [xpChange, setXpChange] = useState(0);

  // Refs para controle de tempo
  const timerRef = useRef(null);
  const penaltyRef = useRef(null);
  const startTimeRef = useRef(0);

  // --- Lógica de Banco de Dados ---
  const saveStats = async (coins, xp) => {
    // 1. Atualiza visualmente
    addCoins(coins);

    // 2. Salva no banco se estiver logado
    if (profile) {
      try {
        await supabase.rpc("increment_stats", {
          user_id_input: profile.id,
          coins_add: coins,
          xp_add: xp,
        });
      } catch (err) {
        console.error("Erro ao salvar stats:", err);
      }
    }
  };

  // --- Lógica do Jogo ---

  const startReadyState = () => {
    setGameState("ready");
    setMessage("Aguarde o verde...");
    setReactionTime(0);
    setCoinChange(0);
    setXpChange(0);

    // Tempo aleatório entre 2 e 5 segundos
    const randomDelay = Math.random() * 3000 + 2000;
    timerRef.current = setTimeout(startGoState, randomDelay);
  };

  const startGoState = () => {
    startTimeRef.current = new Date().getTime();
    setGameState("go");
    setMessage("CLIQUE!");

    // Penalidade se demorar demais (4s)
    penaltyRef.current = setTimeout(() => {
      handleTooLate();
    }, 4000);
  };

  const handleTooEarly = () => {
    clearTimeout(timerRef.current); // Para o timer que ia deixar verde
    setGameState("result");

    const coins = -5;
    const xp = 0;

    setMessage("Muito cedo!");
    setReactionTime(null);
    setCoinChange(coins);
    setXpChange(xp);

    saveStats(coins, xp);
    updateScoreBoard("Cedo", coins);
  };

  const handleTooLate = () => {
    setGameState("result");
    const coins = -5;
    const xp = 0;

    setMessage("Muito lento!");
    setReactionTime(null);
    setCoinChange(coins);
    setXpChange(xp);

    saveStats(coins, xp);
    updateScoreBoard("Lento", coins);
  };

  const handleResult = (timeTaken) => {
    setReactionTime(timeTaken);
    setGameState("result");
    setMessage("Tempo:");

    // Cálculo de Moedas e XP baseado no tempo
    let coins = 0;
    let xp = 0;

    if (timeTaken < 200) {
      // Deus Gamer
      coins = 20;
      xp = 50;
    } else if (timeTaken < 250) {
      // Pro
      coins = 10;
      xp = 30;
    } else if (timeTaken < 350) {
      // Bom
      coins = 5;
      xp = 15;
    } else if (timeTaken < 500) {
      // Médio
      coins = 2;
      xp = 5;
    } else {
      // Lento
      coins = 1;
      xp = 1;
    }

    setCoinChange(coins);
    setXpChange(xp);
    saveStats(coins, xp);
    updateScoreBoard(`${timeTaken} ms`, coins);
  };

  const updateScoreBoard = (label, coins) => {
    setScores((prev) => [{ label, value: coins }, ...prev].slice(0, 7)); // Guarda os últimos 7
  };

  const handleClick = () => {
    if (gameState === "waiting") {
      startReadyState();
      return;
    }
    if (gameState === "ready") {
      handleTooEarly();
      return;
    }
    if (gameState === "go") {
      clearTimeout(penaltyRef.current);
      const endTime = new Date().getTime();
      const timeTaken = endTime - startTimeRef.current;
      handleResult(timeTaken);
      return;
    }
    if (gameState === "result") {
      setGameState("waiting");
      setMessage("Clique para começar");
      setReactionTime(0);
      setCoinChange(0);
      return;
    }
  };

  return (
    <div className="reaction-game-container">
      {/* TOP BAR */}
      <div className="top-bar">
        <button className="action-text-btn" onClick={() => navigate("/jogos")}>
          ← Voltar
        </button>
      </div>

      <div className="reaction-content-wrapper">
        {/* ÁREA PRINCIPAL */}
        <div className="reaction-main">
          <div className={`reaction-box ${gameState}`} onClick={handleClick}>
            {/* Ícones/Textos visuais para cada estado */}
            {gameState === "waiting" && (
              <span style={{ fontSize: "3rem" }}>⚡</span>
            )}
            {gameState === "ready" && (
              <span style={{ fontSize: "3rem" }}>🛑</span>
            )}

            <h1 className="reaction-message">{message}</h1>

            {gameState === "result" &&
              reactionTime !== null &&
              reactionTime !== 0 && (
                <h2 className="reaction-time">{reactionTime} ms</h2>
              )}

            {gameState === "result" && (coinChange !== 0 || xpChange !== 0) && (
              <div className="result-details">
                <span
                  className={`coin-result ${coinChange >= 0 ? "positive" : "negative"}`}
                >
                  {coinChange > 0 ? `+${coinChange}` : coinChange} Moedas
                </span>
                {xpChange > 0 && (
                  <span className="xp-result">+{xpChange} XP</span>
                )}
              </div>
            )}

            {gameState === "waiting" && (
              <p style={{ color: "#aaa", marginTop: "10px" }}>
                Teste seus reflexos!
              </p>
            )}
          </div>
        </div>

        {/* RANKING LATERAL */}
        <div className="reaction-ranking">
          <h3>Últimos Tempos</h3>
          <ul>
            {scores.length === 0 && (
              <li style={{ color: "#666", justifyContent: "center" }}>
                Jogue para registrar!
              </li>
            )}
            {scores.map((score, index) => (
              <li key={index}>
                <span>{score.label}</span>
                <span
                  className={score.value > 0 ? "coins-plus" : "coins-minus"}
                >
                  {score.value > 0 ? "+" : ""}
                  {score.value} 💰
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReactionTestGame;
