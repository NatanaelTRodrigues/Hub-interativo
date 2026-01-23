import React, { useState, useEffect, useRef } from "react";
import "./ReactionTest.css";
import { useApp } from "../../contexts/AppContext"; // 1. Importar

const ReactionTestGame = () => {
  const [gameState, setGameState] = useState("waiting");
  const [reactionTime, setReactionTime] = useState(0);
  const [message, setMessage] = useState("Clique para iniciar");
  const [scores, setScores] = useState([]);
  const [coinChange, setCoinChange] = useState(0);

  // 2. Substituir o useState local
  const { userCoins, addCoins } = useApp();

  const timerRef = useRef(null);
  const penaltyRef = useRef(null);
  const startTimeRef = useRef(0);

  const startGoState = () => {
    startTimeRef.current = new Date().getTime();
    setGameState("go");
    setMessage("CLIQUE!");
    penaltyRef.current = setTimeout(() => {
      handleTooLate();
    }, 4000);
  };

  const startReadyState = () => {
    setGameState("ready");
    setMessage("Aguarde ficar verde...");
    const randomDelay = Math.random() * 3000 + 2000;
    timerRef.current = setTimeout(startGoState, randomDelay);
  };

  const handleTooEarly = () => {
    clearTimeout(timerRef.current);
    setGameState("result");
    const penalty = -5;
    setMessage(`Muito cedo! ${penalty} moedas.`);
    setReactionTime(null);
    setCoinChange(penalty);
    addCoins(penalty); // 3. Usar addCoins
    setScores((prevScores) =>
      [{ label: "Cedo", value: penalty, unit: "moedas" }, ...prevScores].slice(
        0,
        5
      )
    );
  };

  const handleTooLate = () => {
    setGameState("result");
    const penalty = -10;
    setMessage(`Muito lento! ${penalty} moedas.`);
    setReactionTime(null);
    setCoinChange(penalty);
    addCoins(penalty); // 3. Usar addCoins
    setScores((prevScores) =>
      [{ label: "Lento", value: penalty, unit: "moedas" }, ...prevScores].slice(
        0,
        5
      )
    );
  };

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
    addCoins(change); // 3. Usar addCoins
    setScores((prevScores) =>
      [
        { label: `${timeTaken} ms`, value: change, unit: "moedas" },
        ...prevScores,
      ].slice(0, 5)
    );
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
      setMessage("Clique para iniciar");
      setReactionTime(0);
      setCoinChange(0);
      return;
    }
  };

  return (
    <div className="reaction-game-container">
      <div className="reaction-main">
        <div className={`reaction-box ${gameState}`} onClick={handleClick}>
          <h1 className="reaction-message">{message}</h1>
          {gameState === "result" && reactionTime && (
            <h2 className="reaction-time">{reactionTime} ms</h2>
          )}
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
      <div className="reaction-ranking">
        <h3>Últimos Tempos</h3>
        <ul>
          {scores.length === 0 && <li>Jogue para ver seus tempos!</li>}
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
