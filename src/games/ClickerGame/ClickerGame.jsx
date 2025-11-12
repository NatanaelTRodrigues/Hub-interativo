import React, { useState, useEffect, useRef } from "react";
import "./ClickerGame.css"; // Vamos criar este arquivo

const GAME_DURATION = 5; // Duração do jogo em segundos

const ClickerGame = () => {
  // --- Estados do Jogo ---
  const [clickCount, setClickCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  // 'setup', 'playing', 'result'
  const [gameState, setGameState] = useState("setup");

  // Simulação de moedas
  const [userCoins, setUserCoins] = useState(100);
  const [rewardMessage, setRewardMessage] = useState("");

  const timerRef = useRef(null); // Referência para o setInterval

  // --- Lógica do Timer ---
  useEffect(() => {
    // Só roda o timer se o jogo estiver 'playing'
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Tempo acabou
            clearInterval(timerRef.current);
            endGame();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    // Limpeza
    return () => clearInterval(timerRef.current);
  }, [gameState]); // Depende do gameState

  // --- Funções de Controle ---

  const startGame = () => {
    setGameState("playing");
    setClickCount(0);
    setTimeLeft(GAME_DURATION);
    setRewardMessage("");
  };

  // Chamada automaticamente pelo timer
  const endGame = () => {
    setGameState("result");

    // Calcula a recompensa
    // (O clickCount ainda está sendo atualizado, então usamos um 'updater' no setRewardMessage)
    setClickCount((currentClicks) => {
      let reward = 0;
      let message = "";

      // A penalidade que você pediu
      if (currentClicks <= 15) {
        reward = -10; // Perde 10 moedas
        message = `Muito lento! ${currentClicks} cliques. Você perdeu ${reward} moedas.`;
      }
      // Recompensas
      else if (currentClicks < 25) {
        reward = 5;
        message = `OK! ${currentClicks} cliques. +${reward} moedas.`;
      } else if (currentClicks < 40) {
        reward = 15;
        message = `Rápido! ${currentClicks} cliques. +${reward} moedas.`;
      } else {
        reward = 30;
        message = `Incrível! ${currentClicks} cliques. +${reward} moedas.`;
      }

      setUserCoins((c) => c + reward);
      setRewardMessage(message);
      return currentClicks;
    });
  };

  const restartGame = () => {
    setGameState("setup");
  };

  // --- Manipulador de Clique ---

  const handleMainClick = () => {
    // Se o jogo está rolando, conta o clique
    if (gameState === "playing") {
      setClickCount((c) => c + 1);
    }
    // Se está em 'setup', inicia o jogo
    else if (gameState === "setup") {
      startGame();
    }
    // Se está em 'result', reinicia
    else if (gameState === "result") {
      restartGame();
    }
  };

  // Define o texto e a classe do botão
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
      <div className="coin-display">Moedas: {userCoins} 💰</div>

      <h1 className="clicker-game-title">Teste de Cliques</h1>
      <p className="clicker-instructions">
        Clique o mais rápido que puder em {GAME_DURATION} segundos!
      </p>

      <div className="clicker-game-area">
        {/* Timer */}
        {gameState !== "setup" && (
          <div className="clicker-timer">
            Tempo: <span>{timeLeft}s</span>
          </div>
        )}

        {/* Botão Principal */}
        <button
          className={buttonClass}
          onClick={handleMainClick}
          disabled={gameState === "playing" && timeLeft === 0} // Desabilita por 1ms qnd acaba
        >
          {buttonText}
        </button>

        {/* Mensagem de Resultado */}
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
