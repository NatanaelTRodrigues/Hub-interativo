import React, { useState, useEffect, useRef } from "react";
import "./ClickerGame.css";
import { useApp } from "../../contexts/AppContext"; // 1. Importar

const GAME_DURATION = 5;

const ClickerGame = () => {
  const [clickCount, setClickCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameState, setGameState] = useState("setup");

  // 2. Substituir o useState local
  const { userCoins, addCoins } = useApp();
  const [rewardMessage, setRewardMessage] = useState("");

  const timerRef = useRef(null);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            endGame(); // Chama o endGame
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]); // Dependência em 'gameState' está correta

  // ⭐ 3. Atualizar o endGame
  const endGame = () => {
    setGameState("result");
    setClickCount((currentClicks) => {
      let reward = 0;
      let message = "";

      if (currentClicks <= 15) {
        reward = -10;
        message = `Muito lento! ${currentClicks} cliques. Você perdeu ${reward} moedas.`;
      } else if (currentClicks < 25) {
        reward = 5;
        message = `OK! ${currentClicks} cliques. +${reward} moedas.`;
      } else if (currentClicks < 40) {
        reward = 15;
        message = `Rápido! ${currentClicks} cliques. +${reward} moedas.`;
      } else {
        reward = 30;
        message = `Incrível! ${currentClicks} cliques. +${reward} moedas.`;
      }

      addCoins(reward); // Usa addCoins

      setRewardMessage(message);
      return currentClicks;
    });
  };

  const startGame = () => {
    setGameState("playing");
    setClickCount(0);
    setTimeLeft(GAME_DURATION);
    setRewardMessage("");
  };

  const restartGame = () => {
    setGameState("setup");
  };

  const handleMainClick = () => {
    if (gameState === "playing") {
      setClickCount((c) => c + 1);
    } else if (gameState === "setup") {
      startGame();
    } else if (gameState === "result") {
      restartGame();
    }
  };

  let buttonText = "Começar";
  let buttonClass = "clicker-button setup";
  if (gameState === "playing") {
    buttonText = `Clique! (${clickCount})`;
    buttonClass = "clicker-button playing";
  } else if (gameState === "result") {
    buttonText = "Jogar Novamente";
    buttonClass = "clicker-button result";
  }

  return (
    <div className="clicker-game-container">
      <h1 className="clicker-game-title">Teste de Cliques</h1>
      <p className="clicker-instructions">
        Clique o mais rápido que puder em {GAME_DURATION} segundos!
      </p>
      <div className="clicker-game-area">
        {gameState !== "setup" && (
          <div className="clicker-timer">
            Tempo: <span>{timeLeft}s</span>
          </div>
        )}
        <button
          className={buttonClass}
          onClick={handleMainClick}
          disabled={gameState === "playing" && timeLeft === 0}
        >
          {buttonText}
        </button>
        {gameState === "result" && (
          <div className="clicker-result">
            <h3>{rewardMessage}</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClickerGame;
