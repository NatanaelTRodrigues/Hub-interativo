import React, { useRef, useEffect, useState, useCallback } from "react";
import "./Pong.css";
import { useApp } from "../../contexts/AppContext";

// --- Constantes do Jogo (sem mudança) ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PADDLE_SPEED = 8;
const BOT_SPEEDS = {
  easy: 3,
  medium: 5,
  hard: 7,
  impossible: 10,
};
const keysPressed = {};

const PongGame = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);

  const [gameMode, setGameMode] = useState("pvc");
  const [difficulty, setDifficulty] = useState("easy");
  const [maxScore, setMaxScore] = useState(5);
  const [gameState, setGameState] = useState("setup");

  const { userCoins, addCoins } = useApp();
  const [rewardMessage, setRewardMessage] = useState("");

  const player1Ref = useRef({
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    score: 0,
  });
  const player2Ref = useRef({
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    score: 0,
  });
  const ballRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: 5,
    dy: 5,
  });

  // --- Funções de Desenho, Lógica e Controles (NENHUMA MUDANÇA AQUI) ---
  // ... (todo o código de 'draw', 'resetBall', 'update', 'gameLoop', 'startGame', etc. continua o mesmo) ...
  // ... (Não precisa copiar as funções internas se elas já existem, apenas a estrutura de renderização abaixo) ...

  // (Vou pular o código interno que não muda para ser breve)
  // (Certifique-se que suas funções draw, update, resetBall, gameLoop, startGame, endGame, backToSetup, etc. ainda estão aqui)

  const draw = useCallback(
    (ctx) => {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = "#555";
      ctx.fillRect(CANVAS_WIDTH / 2 - 1, 0, 2, CANVAS_HEIGHT);
      ctx.fillStyle = "#4d90fe";
      ctx.fillRect(10, player1Ref.current.y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillStyle = gameMode === "pvc" ? "#ff6b6b" : "#4d90fe";
      ctx.fillRect(
        CANVAS_WIDTH - PADDLE_WIDTH - 10,
        player2Ref.current.y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(
        ballRef.current.x,
        ballRef.current.y,
        BALL_SIZE / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "60px sans-serif";
      ctx.fillText(player1Ref.current.score, CANVAS_WIDTH / 4, 70);
      ctx.fillText(player2Ref.current.score, (CANVAS_WIDTH / 4) * 3, 70);
    },
    [gameMode]
  );

  const resetBall = (direction) => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: 5 * direction,
      dy: (Math.random() > 0.5 ? 1 : -1) * 5,
    };
  };

  const update = useCallback(() => {
    const ball = ballRef.current;
    const player1 = player1Ref.current;
    const player2 = player2Ref.current;

    if (keysPressed["w"] && player1.y > 0) player1.y -= PADDLE_SPEED;
    if (keysPressed["s"] && player1.y < CANVAS_HEIGHT - PADDLE_HEIGHT)
      player1.y += PADDLE_SPEED;

    if (gameMode === "pvp") {
      if (keysPressed["ArrowUp"] && player2.y > 0) player2.y -= PADDLE_SPEED;
      if (keysPressed["ArrowDown"] && player2.y < CANVAS_HEIGHT - PADDLE_HEIGHT)
        player2.y += PADDLE_SPEED;
    } else {
      const botSpeed = BOT_SPEEDS[difficulty];
      const botCenter = player2.y + PADDLE_HEIGHT / 2;
      if (botCenter < ball.y - 20 && player2.y < CANVAS_HEIGHT - PADDLE_HEIGHT)
        player2.y += botSpeed;
      else if (botCenter > ball.y + 20 && player2.y > 0) player2.y -= botSpeed;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y - BALL_SIZE / 2 < 0 || ball.y + BALL_SIZE / 2 > CANVAS_HEIGHT)
      ball.dy = -ball.dy;

    if (ball.x - BALL_SIZE / 2 < 0) {
      player2.score += 1;
      resetBall(1);
    }
    if (ball.x + BALL_SIZE / 2 > CANVAS_WIDTH) {
      player1.score += 1;
      resetBall(-1);
    }

    if (
      ball.x - BALL_SIZE / 2 < 10 + PADDLE_WIDTH &&
      ball.y > player1.y &&
      ball.y < player1.y + PADDLE_HEIGHT
    ) {
      ball.dx = -ball.dx * 1.05;
      ball.dy *= 1.05;
    }
    if (
      ball.x + BALL_SIZE / 2 > CANVAS_WIDTH - 10 - PADDLE_WIDTH &&
      ball.y > player2.y &&
      ball.y < player2.y + PADDLE_HEIGHT
    ) {
      ball.dx = -ball.dx * 1.05;
      ball.dy *= 1.05;
    }

    if (player1.score >= maxScore || player2.score >= maxScore) {
      endGame();
    }
  }, [gameMode, difficulty, maxScore]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    update();
    draw(ctx);
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [update, draw]);

  const endGame = useCallback(() => {
    cancelAnimationFrame(gameLoopRef.current);
    setGameState("gameover");
    const p1Score = player1Ref.current.score;
    const p2Score = player2Ref.current.score;

    if (gameMode === "pvc" && p1Score > p2Score) {
      const diffIndex = Object.keys(BOT_SPEEDS).indexOf(difficulty);
      const reward = (maxScore / 2) * (diffIndex + 1) * 5;
      setRewardMessage(`Você venceu! +${reward} moedas!`);
      addCoins(reward);
    } else if (gameMode === "pvc" && p2Score > p1Score) {
      setRewardMessage("O Bot venceu. Tente novamente.");
    } else if (gameMode === "pvp") {
      const winner = p1Score > p2Score ? "Jogador 1" : "Jogador 2";
      setRewardMessage(`${winner} venceu a partida!`);
    }
  }, [gameMode, difficulty, maxScore]);

  const startGame = useCallback(() => {
    player1Ref.current = { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0 };
    player2Ref.current = { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0 };
    resetBall(1);
    setGameState("playing");
    setRewardMessage("");
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const backToSetup = useCallback(() => {
    setGameState("setup");
    setRewardMessage("");
    const ctx = canvasRef.current.getContext("2d");
    draw(ctx);
  }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed[e.key] = true;
    };
    const handleKeyUp = (e) => {
      keysPressed[e.key] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    draw(ctx);
  }, [draw]);

  // --- AQUI ESTÁ A MUDANÇA NA RENDERIZAÇÃO ---
  return (
    <div className="pong-game-container">
      <div className="coin-display">Moedas: {userCoins} 💰</div>
      <h1 className="pong-game-title">Pong</h1>
      {/* ⭐⭐⭐ NOVO WRAPPER AQUI ⭐⭐⭐ */}
      <div className="pong-game-area">
        {/* O overlay agora está DENTRO do novo wrapper */}
        {gameState !== "playing" && (
          <div className="pong-overlay">
            {/* Tela de Setup */}
            {gameState === "setup" && (
              <div className="pong-setup">
                <h2>Configurar Partida</h2>
                <div className="pong-option">
                  <label>Modo de Jogo:</label>
                  <button
                    onClick={() => setGameMode("pvc")}
                    className={gameMode === "pvc" ? "active" : ""}
                  >
                    vs. Bot
                  </button>
                  <button
                    onClick={() => setGameMode("pvp")}
                    className={gameMode === "pvp" ? "active" : ""}
                  >
                    2 Jogadores
                  </button>
                </div>
                {gameMode === "pvc" && (
                  <div className="pong-option">
                    <label>Dificuldade:</label>
                    <button
                      onClick={() => setDifficulty("easy")}
                      className={difficulty === "easy" ? "active" : ""}
                    >
                      Fácil
                    </button>
                    <button
                      onClick={() => setDifficulty("medium")}
                      className={difficulty === "medium" ? "active" : ""}
                    >
                      Médio
                    </button>
                    <button
                      onClick={() => setDifficulty("hard")}
                      className={difficulty === "hard" ? "active" : ""}
                    >
                      Difícil
                    </button>
                    <button
                      onClick={() => setDifficulty("impossible")}
                      className={difficulty === "impossible" ? "active" : ""}
                    >
                      Impossível
                    </button>
                  </div>
                )}
                <div className="pong-option">
                  <label>Pontos para Vencer:</label>
                  <button
                    onClick={() => setMaxScore(3)}
                    className={maxScore === 3 ? "active" : ""}
                  >
                    3
                  </button>
                  <button
                    onClick={() => setMaxScore(5)}
                    className={maxScore === 5 ? "active" : ""}
                  >
                    5
                  </button>
                  <button
                    onClick={() => setMaxScore(10)}
                    className={maxScore === 10 ? "active" : ""}
                  >
                    10
                  </button>
                </div>
                <button className="pong-start-button" onClick={startGame}>
                  Iniciar Jogo
                </button>
                <div className="pong-controls-info">
                  P1: [W] Cima, [S] Baixo | P2: [Seta Cima], [Seta Baixo]
                </div>
              </div>
            )}

            {/* Tela de Fim de Jogo */}
            {gameState === "gameover" && (
              <div className="pong-gameover">
                <h2>Fim de Jogo!</h2>
                <h3>{rewardMessage}</h3>
                <button className="pong-start-button" onClick={backToSetup}>
                  Voltar ao Menu
                </button>
              </div>
            )}
          </div>
        )}

        {/* O canvas também está DENTRO do novo wrapper */}
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      </div>{" "}
      {/* ⭐⭐⭐ FIM DO NOVO WRAPPER ⭐⭐⭐ */}
    </div>
  );
};

export default PongGame;
