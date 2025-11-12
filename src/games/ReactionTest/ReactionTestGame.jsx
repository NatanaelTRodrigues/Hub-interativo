import React, { useState, useEffect, useRef } from "react";
import "./ReactionTest.css"; // O CSS não muda

const ReactionTestGame = () => {
  // --- Estados do Jogo ---
  const [gameState, setGameState] = useState("waiting");
  const [reactionTime, setReactionTime] = useState(0);
  const [message, setMessage] = useState("Clique para iniciar");
  const [scores, setScores] = useState([]); // Ranking lateral
  const [userCoins, setUserCoins] = useState(100);
  const [coinChange, setCoinChange] = useState(0); // Mudança de moedas na tela

  // --- Refs para Timeouts ---
  const timerRef = useRef(null);
  const penaltyRef = useRef(null);
  const startTimeRef = useRef(0);

  // --- Funções de Lógica do Jogo ---

  const startGoState = () => {
    startTimeRef.current = new Date().getTime(); // Salva o tempo de início
    setGameState("go");
    setMessage("CLIQUE!");

    penaltyRef.current = setTimeout(() => {
      handleTooLate(); // Chama a penalidade por demora
    }, 4000);
  };

  const startReadyState = () => {
    setGameState("ready");
    setMessage("Aguarde ficar verde...");
    const randomDelay = Math.random() * 3000 + 2000;

    timerRef.current = setTimeout(() => {
      startGoState();
    }, randomDelay);
  };

  // --- Manipuladores de Resultado ---

  // ⭐⭐⭐ NOVA FUNÇÃO ⭐⭐⭐
  // Chamada ao clicar no 'ready' (laranja)
  const handleTooEarly = () => {
    clearTimeout(timerRef.current); // Cancela o timer que ia ficar verde
    setGameState("result");

    const penalty = -5; // Penalidade por clicar cedo
    setMessage(`Muito cedo! ${penalty} moedas.`);

    setReactionTime(null);
    setCoinChange(penalty);
    setUserCoins((coins) => coins + penalty);

    // Adiciona ao placar
    setScores((prevScores) =>
      [{ label: "Cedo", value: penalty, unit: "moedas" }, ...prevScores].slice(
        0,
        5
      )
    );
  };

  // Chamada se demorar mais de 4s
  const handleTooLate = () => {
    setGameState("result");

    const penalty = -10; // Penalidade por demora
    setMessage(`Muito lento! ${penalty} moedas.`);

    setReactionTime(null);
    setCoinChange(penalty);
    setUserCoins((coins) => coins + penalty);

    setScores((prevScores) =>
      [{ label: "Lento", value: penalty, unit: "moedas" }, ...prevScores].slice(
        0,
        5
      )
    );
  };

  // Chamada ao clicar no 'go' (verde)
  const handleResult = (timeTaken) => {
    setReactionTime(timeTaken);
    setGameState("result");
    setMessage(`Seu tempo: ${timeTaken} ms`);

    let change = 0;
    if (timeTaken < 150) change = 20;
    else if (timeTaken < 250) change = 10;
    else if (timeTaken < 400) change = 5;
    else if (timeTaken < 1000) change = 1;

    setCoinChange(change);
    setUserCoins((coins) => coins + change);

    setScores((prevScores) =>
      [
        { label: `${timeTaken} ms`, value: change, unit: "moedas" },
        ...prevScores,
      ].slice(0, 5)
    );
  };

  // --- Manipulador de Clique Principal ---

  const handleClick = () => {
    // 1. 'waiting' (vermelho) -> 'ready'
    if (gameState === "waiting") {
      startReadyState();
      return;
    }

    // 2. 'ready' (laranja) -> Clicou cedo
    if (gameState === "ready") {
      // ⭐⭐⭐ MUDANÇA AQUI ⭐⭐⭐
      handleTooEarly(); // Chama a nova função de penalidade
      return;
    }

    // 3. 'go' (verde) -> Clique certo
    if (gameState === "go") {
      clearTimeout(penaltyRef.current); // Cancela a penalidade
      const endTime = new Date().getTime();
      const timeTaken = endTime - startTimeRef.current;
      handleResult(timeTaken);
      return;
    }

    // 4. 'result' -> Reinicia
    if (gameState === "result") {
      setGameState("waiting");
      setMessage("Clique para iniciar");
      setReactionTime(0);
      setCoinChange(0);
      return;
    }
  };

  return (
    <div className="reaction-game-container">
      <div className="coin-display">Moedas: {userCoins} 💰</div>

      <div className="reaction-main">
        {/* O Botão/Tela Principal do Jogo */}
        <div className={`reaction-box ${gameState}`} onClick={handleClick}>
          <h1 className="reaction-message">{message}</h1>

          {gameState === "result" && reactionTime && (
            <h2 className="reaction-time">{reactionTime} ms</h2>
          )}

          {/* Mensagem de moedas (positiva ou negativa) */}
          {gameState === "result" && coinChange !== 0 && (
            <span
              className={`coin-result ${
                coinChange > 0 ? "positive" : "negative"
              }`}
            >
              {coinChange > 0 ? `+${coinChange}` : coinChange} moedas
            </span>
          )}
        </div>
      </div>

      {/* O Ranking na Lateral */}
      <div className="reaction-ranking">
        <h3>Últimos Tempos</h3>
        <ul>
          {scores.length === 0 && <li>Jogue para ver seus tempos!</li>}

          {/* ⭐⭐⭐ LÓGICA DO PLACAR ATUALIZADA ⭐⭐⭐ */}
          {scores.map((score, index) => (
            <li key={index}>
              <span>{score.label}</span>
              <span
                className={
                  score.value > 0
                    ? "coins-plus"
                    : score.value < 0
                    ? "coins-minus"
                    : ""
                }
              >
                ({score.value > 0 ? "+" : ""}
                {score.value} {score.unit})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReactionTestGame;
