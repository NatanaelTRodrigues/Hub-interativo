import React, { useRef, useEffect, useState, useCallback } from "react";
import "./Pong.css";
import { useApp } from "../../contexts/AppContext";

// --- Constantes ---
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
  impossible: 10.5, // Um pouco mais rápido que o jogador
};

// Array para mapear a ordem das dificuldades
const difficultyLevels = ["easy", "medium", "hard", "impossible"];

const keysPressed = {};

const PongGame = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);

  // --- Estados ---
  const [gameMode, setGameMode] = useState("pvc");
  const [difficulty, setDifficulty] = useState("easy");
  const [unlockedDifficulty, setUnlockedDifficulty] = useState("easy"); // Progressão
  const [maxScore, setMaxScore] = useState(5);
  const [gameState, setGameState] = useState("setup");

  // Ref para o loop (Evita bugs de estado)
  const gameStateRef = useRef("setup");

  const { userCoins, addCoins, isAdmin } = useApp(); // Pegamos isAdmin
  const [rewardMessage, setRewardMessage] = useState("");

  // Refs de Posição
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

  // --- Função de Desenho ---
  const draw = useCallback(
    (ctx) => {
      // Fundo
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Linha central
      ctx.fillStyle = "#555";
      ctx.fillRect(CANVAS_WIDTH / 2 - 1, 0, 2, CANVAS_HEIGHT);
      // Player 1
      ctx.fillStyle = "#4d90fe";
      ctx.fillRect(10, player1Ref.current.y, PADDLE_WIDTH, PADDLE_HEIGHT);
      // Player 2
      ctx.fillStyle = gameMode === "pvc" ? "#ff6b6b" : "#4d90fe";
      ctx.fillRect(
        CANVAS_WIDTH - PADDLE_WIDTH - 10,
        player2Ref.current.y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );
      // Bola
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
      // Placar
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

  // --- Fim de Jogo ---
  const endGame = useCallback(() => {
    if (rewardMessage !== "") return; // Trava para não rodar 2x

    cancelAnimationFrame(gameLoopRef.current);
    setGameState("gameover");
    gameStateRef.current = "gameover";

    const p1Score = player1Ref.current.score;
    const p2Score = player2Ref.current.score;

    if (gameMode === "pvc" && p1Score > p2Score) {
      // Jogador venceu Bot
      const diffIndex = difficultyLevels.indexOf(difficulty);
      const reward = maxScore * (diffIndex + 1) * 5; // Fórmula de recompensa

      addCoins(reward);
      setRewardMessage(`Você venceu! +${reward} moedas!`);

      // Desbloquear próximo nível
      const currentLevelIndex = difficultyLevels.indexOf(difficulty);
      const unlockedLevelIndex = difficultyLevels.indexOf(unlockedDifficulty);
      if (
        currentLevelIndex === unlockedLevelIndex &&
        currentLevelIndex < difficultyLevels.length - 1
      ) {
        const nextDiff = difficultyLevels[currentLevelIndex + 1];
        setUnlockedDifficulty(nextDiff);
        setRewardMessage((msg) => msg + ` Nível "${nextDiff}" liberado!`);
      }
    } else if (gameMode === "pvc" && p2Score > p1Score) {
      setRewardMessage("O Bot venceu. Tente novamente.");
    } else if (gameMode === "pvp") {
      const winner = p1Score > p2Score ? "Jogador 1" : "Jogador 2";
      setRewardMessage(`${winner} venceu a partida!`);
    }
  }, [
    addCoins,
    difficulty,
    gameMode,
    maxScore,
    rewardMessage,
    unlockedDifficulty,
  ]);

  // --- Lógica Física ---
  const update = useCallback(() => {
    const ball = ballRef.current;
    const player1 = player1Ref.current;
    const player2 = player2Ref.current;

    // Movimento Player 1
    if (keysPressed["w"] && player1.y > 0) player1.y -= PADDLE_SPEED;
    if (keysPressed["s"] && player1.y < CANVAS_HEIGHT - PADDLE_HEIGHT)
      player1.y += PADDLE_SPEED;

    // Movimento Player 2
    if (gameMode === "pvp") {
      if (keysPressed["ArrowUp"] && player2.y > 0) player2.y -= PADDLE_SPEED;
      if (keysPressed["ArrowDown"] && player2.y < CANVAS_HEIGHT - PADDLE_HEIGHT)
        player2.y += PADDLE_SPEED;
    } else {
      // IA do Bot
      const botSpeed = BOT_SPEEDS[difficulty];
      const botCenter = player2.y + PADDLE_HEIGHT / 2;
      // Pequeno "erro" humano para não ser perfeito
      const reactionDelay = difficulty === "impossible" ? 0 : 15;

      if (
        botCenter < ball.y - reactionDelay &&
        player2.y < CANVAS_HEIGHT - PADDLE_HEIGHT
      ) {
        player2.y += botSpeed;
      } else if (botCenter > ball.y + reactionDelay && player2.y > 0) {
        player2.y -= botSpeed;
      }
    }

    // Movimento Bola
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Colisão Paredes Y
    if (ball.y - BALL_SIZE / 2 < 0 || ball.y + BALL_SIZE / 2 > CANVAS_HEIGHT)
      ball.dy = -ball.dy;

    // Pontuação
    if (ball.x < 0) {
      player2.score += 1;
      resetBall(1);
    }
    if (ball.x > CANVAS_WIDTH) {
      player1.score += 1;
      resetBall(-1);
    }

    // Colisão Paddles
    // P1
    if (
      ball.x - BALL_SIZE / 2 < 10 + PADDLE_WIDTH &&
      ball.y > player1.y &&
      ball.y < player1.y + PADDLE_HEIGHT
    ) {
      ball.dx = -ball.dx * 1.05; // Acelera
      ball.x = 10 + PADDLE_WIDTH + BALL_SIZE / 2 + 1; // Evita "grudar"
    }
    // P2
    if (
      ball.x + BALL_SIZE / 2 > CANVAS_WIDTH - 10 - PADDLE_WIDTH &&
      ball.y > player2.y &&
      ball.y < player2.y + PADDLE_HEIGHT
    ) {
      ball.dx = -ball.dx * 1.05;
      ball.x = CANVAS_WIDTH - 10 - PADDLE_WIDTH - BALL_SIZE / 2 - 1;
    }

    if (player1.score >= maxScore || player2.score >= maxScore) {
      endGame();
    }
  }, [gameMode, difficulty, maxScore, endGame]);

  // --- Loop Principal ---
  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== "playing") return; // Checa o Ref

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    update();
    draw(ctx);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [update, draw]);

  const startGame = useCallback(() => {
    player1Ref.current.score = 0;
    player2Ref.current.score = 0;
    player1Ref.current.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    player2Ref.current.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;

    resetBall(1);
    setRewardMessage("");
    setGameState("playing");
    gameStateRef.current = "playing"; // Atualiza Ref

    cancelAnimationFrame(gameLoopRef.current);
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const backToSetup = useCallback(() => {
    setGameState("setup");
    gameStateRef.current = "setup";
    setRewardMessage("");
    const ctx = canvasRef.current.getContext("2d");
    draw(ctx);
  }, [draw]);

  // Listeners
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

  // Desenho Inicial
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    draw(ctx);
  }, [draw]);

  return (
    <div className="pong-game-container">
      <h1 className="pong-game-title">Pong</h1>
      <div className="pong-game-area">
        {gameState !== "playing" && (
          <div className="pong-overlay">
            {gameState === "setup" && (
              <div className="pong-setup">
                <h2>Configurar Partida</h2>
                <div className="pong-option">
                  <label>Modo:</label>
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
                    2 Players
                  </button>
                </div>

                {gameMode === "pvc" && (
                  <div className="pong-option">
                    <label>Dificuldade:</label>
                    {difficultyLevels.map((level) => {
                      const levelIndex = difficultyLevels.indexOf(level);
                      const unlockedIndex =
                        difficultyLevels.indexOf(unlockedDifficulty);
                      // ⭐ LÓGICA DE ADMIN: Se for admin, ignora o bloqueio
                      const isLocked = !isAdmin && levelIndex > unlockedIndex;

                      return (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={difficulty === level ? "active" : ""}
                          disabled={isLocked}
                        >
                          {isLocked
                            ? "🔒"
                            : isAdmin && levelIndex > unlockedIndex
                            ? "🔓 "
                            : ""}{" "}
                          {level}
                        </button>
                      );
                    })}
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
                <div className="pong-controls-info">P1: W/S | P2: Setas</div>
              </div>
            )}

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
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      </div>
    </div>
  );
};

export default PongGame;
