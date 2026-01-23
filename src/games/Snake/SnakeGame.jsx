import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Snake.css";
import { useApp } from "../../contexts/AppContext";

const GRID_SIZE = 20;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const SPEEDS = { easy: 200, medium: 150, hard: 100, impossible: 75 };
const COIN_REWARDS = { easy: 1, medium: 2, hard: 3, impossible: 5 };
// Níveis em ordem para lógica de desbloqueio
const difficultyLevels = ["easy", "medium", "hard", "impossible"];

const STARTING_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
const STARTING_DIRECTION = { dx: 1, dy: 0 };

const SnakeGame = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [gameState, setGameState] = useState("setup");
  const [score, setScore] = useState(0);
  const gameStateRef = useRef("setup");

  const { userCoins, addCoins, isAdmin } = useApp(); // Pegar isAdmin
  const [rewardMessage, setRewardMessage] = useState("");

  const snakeRef = useRef(STARTING_SNAKE);
  const directionRef = useRef(STARTING_DIRECTION);
  const foodRef = useRef({ x: 0, y: 0 });
  const directionBufferRef = useRef(STARTING_DIRECTION);

  // (Funções placeFood, checkCollision, draw - SEM MUDANÇA)
  // ... Copie suas funções aqui ou use o código anterior ...
  const placeFood = useCallback((snakeBody) => {
    let newFood;
    const maxX = CANVAS_WIDTH / GRID_SIZE;
    const maxY = CANVAS_HEIGHT / GRID_SIZE;
    do {
      newFood = {
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY),
      };
    } while (
      snakeBody.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    foodRef.current = newFood;
  }, []);

  const checkCollision = useCallback((head) => {
    const maxX = CANVAS_WIDTH / GRID_SIZE;
    const maxY = CANVAS_HEIGHT / GRID_SIZE;
    if (head.x < 0 || head.x >= maxX || head.y < 0 || head.y >= maxY)
      return true;
    for (let i = 1; i < snakeRef.current.length; i++) {
      if (head.x === snakeRef.current[i].x && head.y === snakeRef.current[i].y)
        return true;
    }
    return false;
  }, []);

  const draw = useCallback((ctx) => {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#2f9e44";
    snakeRef.current.forEach((segment) => {
      ctx.fillRect(
        segment.x * GRID_SIZE,
        segment.y * GRID_SIZE,
        GRID_SIZE - 1,
        GRID_SIZE - 1
      );
    });
    ctx.fillStyle = "#ff6b6b";
    ctx.fillRect(
      foodRef.current.x * GRID_SIZE,
      foodRef.current.y * GRID_SIZE,
      GRID_SIZE - 1,
      GRID_SIZE - 1
    );
  }, []);

  const endGame = useCallback(() => {
    if (rewardMessage !== "") return;
    clearTimeout(gameLoopRef.current);
    setGameState("gameover");
    gameStateRef.current = "gameover";
    addCoins(score);
    setRewardMessage(`Fim de Jogo! Você fez ${score} moedas!`);
  }, [score, addCoins, rewardMessage]);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== "playing") return;
    directionRef.current = directionBufferRef.current;
    const snake = [...snakeRef.current];
    const head = { ...snake[0] };
    head.x += directionRef.current.dx;
    head.y += directionRef.current.dy;
    if (checkCollision(head)) {
      endGame();
      return;
    }
    snake.unshift(head);
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      const reward = COIN_REWARDS[difficulty];
      setScore((s) => s + reward);
      placeFood(snake);
    } else {
      snake.pop();
    }
    snakeRef.current = snake;
    const ctx = canvasRef.current.getContext("2d");
    draw(ctx);
    gameLoopRef.current = setTimeout(gameLoop, SPEEDS[difficulty]);
  }, [difficulty, checkCollision, draw, endGame, placeFood]);

  const startGame = useCallback(() => {
    snakeRef.current = STARTING_SNAKE;
    directionRef.current = STARTING_DIRECTION;
    directionBufferRef.current = STARTING_DIRECTION;
    placeFood(snakeRef.current);
    setScore(0);
    setGameState("playing");
    gameStateRef.current = "playing";
    setRewardMessage("");
    clearTimeout(gameLoopRef.current);
    gameLoopRef.current = setTimeout(gameLoop, SPEEDS[difficulty]);
  }, [difficulty, placeFood, gameLoop]);

  const backToSetup = useCallback(() => {
    setGameState("setup");
    gameStateRef.current = "setup";
    setRewardMessage("");
    const ctx = canvasRef.current.getContext("2d");
    snakeRef.current = STARTING_SNAKE;
    placeFood(STARTING_SNAKE);
    draw(ctx);
  }, [draw, placeFood]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const dir = directionRef.current;
      switch (e.key) {
        case "ArrowUp":
          if (dir.dy === 0) directionBufferRef.current = { dx: 0, dy: -1 };
          break;
        case "ArrowDown":
          if (dir.dy === 0) directionBufferRef.current = { dx: 0, dy: 1 };
          break;
        case "ArrowLeft":
          if (dir.dx === 0) directionBufferRef.current = { dx: -1, dy: 0 };
          break;
        case "ArrowRight":
          if (dir.dx === 0) directionBufferRef.current = { dx: 1, dy: 0 };
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gameLoopRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    snakeRef.current = STARTING_SNAKE;
    placeFood(STARTING_SNAKE);
    draw(ctx);
  }, [draw, placeFood]);

  return (
    <div className="snake-game-container">
      <h1 className="snake-game-title">Jogo da Cobrinha (Snake)</h1>
      <div className="snake-game-area">
        {gameState !== "playing" && (
          <div className="snake-overlay">
            {gameState === "setup" && (
              <div className="snake-setup">
                <h2>Configurar Jogo</h2>
                <div className="snake-option">
                  <label>Dificuldade:</label>

                  {/* ⭐ SELETOR DE DIFICULDADE COM ADMIN ⭐ */}
                  {difficultyLevels.map((level) => {
                    // Para o Snake, como não salvamos unlockedDifficulty,
                    // podemos apenas deixar o admin livre e usuários normais livres (todos desbloqueados por padrão)
                    // OU implementar unlockedDifficulty igual ao Pong/TicTacToe.
                    // AQUI: Vou deixar livre para todos, mas se quiser bloquear, use a lógica do Pong.
                    return (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={difficulty === level ? "active" : ""}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
                <button className="snake-start-button" onClick={startGame}>
                  Iniciar Jogo
                </button>
                <div className="snake-controls-info">
                  Use as [Setas] para mover
                </div>
              </div>
            )}
            {gameState === "gameover" && (
              <div className="snake-gameover">
                <h2>Fim de Jogo!</h2>
                <h3>{rewardMessage}</h3>
                <button className="snake-start-button" onClick={backToSetup}>
                  Voltar ao Menu
                </button>
              </div>
            )}
          </div>
        )}
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      </div>
      <div className="snake-score">
        Moedas da Partida: <strong>{score}</strong>
      </div>
    </div>
  );
};

export default SnakeGame;
