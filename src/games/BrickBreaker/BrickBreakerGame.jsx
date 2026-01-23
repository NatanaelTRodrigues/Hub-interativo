import React, { useRef, useEffect, useState, useCallback } from "react";
import "./BrickBreaker.css";
import { useApp } from "../../contexts/AppContext"; // 1. Importar

// ... (Constantes do Jogo não mudam) ...
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 20;
const PADDLE_Y = CANVAS_HEIGHT - PADDLE_HEIGHT - 20;
const BALL_RADIUS = 10;
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 10;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 45;
// ... (Fim das Constantes) ...

const BrickBreakerGame = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("setup");
  const gameStateRef = useRef("setup");

  // 2. Substituir o useState local
  const { userCoins, addCoins } = useApp();
  const [rewardMessage, setRewardMessage] = useState(""); // Nossa "trava"

  const paddleRef = useRef({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2 });
  const ballRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: PADDLE_Y - BALL_RADIUS - 5,
    dx: 4,
    dy: -4,
  });
  const bricksRef = useRef([]);

  const createBricks = useCallback(() => {
    const newBricks = [];
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      newBricks[c] = [];
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        newBricks[c][r] = { x: 0, y: 0, isAlive: true };
      }
    }
    bricksRef.current = newBricks;
  }, []);

  const endGame = useCallback(
    (didWin) => {
      // ⭐ 3. Adicionar a "trava"
      if (rewardMessage !== "") return; // Já finalizou

      cancelAnimationFrame(gameLoopRef.current);

      if (didWin) {
        setGameState("won");
        gameStateRef.current = "won";
        const totalReward = score + 50;
        setRewardMessage(`Você venceu! +${totalReward} moedas!`);
        addCoins(totalReward); // Usa addCoins
      } else {
        setGameState("gameover");
        gameStateRef.current = "gameover";
        setRewardMessage(`Fim de Jogo! Você fez ${score} moedas.`);
        addCoins(score); // Usa addCoins
      }
    },
    [score, addCoins, rewardMessage]
  ); // Adicionar dependências

  const checkCollisions = useCallback(() => {
    const ball = ballRef.current;
    const paddle = paddleRef.current;
    if (
      ball.x + ball.dx < BALL_RADIUS ||
      ball.x + ball.dx > CANVAS_WIDTH - BALL_RADIUS
    ) {
      ball.dx = -ball.dx;
    }
    if (ball.y + ball.dy < BALL_RADIUS) {
      ball.dy = -ball.dy;
    } else if (ball.y + ball.dy > CANVAS_HEIGHT - BALL_RADIUS) {
      if (ball.x > paddle.x && ball.x < paddle.x + PADDLE_WIDTH) {
        ball.dy = -ball.dy;
      } else {
        endGame(false);
      }
    }
    let totalBricks = 0;
    let aliveBricks = 0;
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        const brick = bricksRef.current[c][r];
        totalBricks++;
        if (!brick.isAlive) continue;
        aliveBricks++;
        brick.x = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
        brick.y = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
        if (
          ball.x > brick.x &&
          ball.x < brick.x + BRICK_WIDTH &&
          ball.y > brick.y &&
          ball.y < brick.y + BRICK_HEIGHT
        ) {
          ball.dy = -ball.dy;
          brick.isAlive = false;
          setScore((s) => s + 1); // Placar local da partida
        }
      }
    }
    if (aliveBricks === 0 && totalBricks > 0) {
      endGame(true);
    }
  }, [endGame]);

  const draw = useCallback((ctx) => {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#4d90fe";
    ctx.fillRect(paddleRef.current.x, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    const colors = ["#ff6b6b", "#f06595", "#cc5de8", "#845ef7", "#5c7cfa"];
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        const brick = bricksRef.current[c][r];
        if (!brick.isAlive) continue;
        brick.x = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
        brick.y = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
        ctx.fillStyle = colors[r % colors.length];
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      }
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    draw(ctx);
    checkCollisions();
    ballRef.current.x += ballRef.current.dx;
    ballRef.current.y += ballRef.current.dy;
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [draw, checkCollisions]);

  const startGame = useCallback(() => {
    createBricks();
    paddleRef.current.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: PADDLE_Y - BALL_RADIUS - 5,
      dx: 4,
      dy: -4,
    };
    setScore(0);
    setRewardMessage(""); // Limpa a trava
    setGameState("playing");
    gameStateRef.current = "playing";
    cancelAnimationFrame(gameLoopRef.current);
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [createBricks, gameLoop]);

  useEffect(() => {
    createBricks();
    const ctx = canvasRef.current.getContext("2d");
    draw(ctx);
  }, [draw, createBricks]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      if (!canvas || gameStateRef.current !== "playing") return;
      const rect = canvas.getBoundingClientRect();
      let mouseX = e.clientX - rect.left;
      if (mouseX < PADDLE_WIDTH / 2) mouseX = PADDLE_WIDTH / 2;
      if (mouseX > CANVAS_WIDTH - PADDLE_WIDTH / 2)
        mouseX = CANVAS_WIDTH - PADDLE_WIDTH / 2;
      paddleRef.current.x = mouseX - PADDLE_WIDTH / 2;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  return (
    <div className="bb-game-container">
      <h1 className="bb-game-title">Quebra-Blocos</h1>
      <div className="bb-game-area">
        {gameState !== "playing" && (
          <div className="bb-overlay">
            {gameState === "setup" && (
              <div className="bb-setup">
                <h2>Quebra-Blocos</h2>
                <button className="bb-start-button" onClick={startGame}>
                  Iniciar Jogo
                </button>
                <div className="bb-controls-info">
                  Mova o Mouse para controlar a plataforma
                </div>
              </div>
            )}
            {(gameState === "gameover" || gameState === "won") && (
              <div className="bb-gameover">
                <h2>{gameState === "won" ? "Você Venceu!" : "Fim de Jogo!"}</h2>
                <h3>{rewardMessage}</h3>
                <button className="bb-start-button" onClick={startGame}>
                  Jogar Novamente
                </button>
              </div>
            )}
          </div>
        )}
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      </div>
      <div className="bb-score">
        Moedas da Partida: <strong>{score}</strong>
      </div>
    </div>
  );
};

export default BrickBreakerGame;
