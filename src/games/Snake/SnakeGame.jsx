import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Snake.css";
import { useApp } from "../../contexts/AppContext";

// --- Configuração do Jogo (Sem mudança) ---
const GRID_SIZE = 20;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const SPEEDS = {
  easy: 200,
  medium: 150,
  hard: 100,
  impossible: 75,
};
const COIN_REWARDS = {
  easy: 1,
  medium: 2,
  hard: 3,
  impossible: 5,
};
const STARTING_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
const STARTING_DIRECTION = { dx: 1, dy: 0 };

const SnakeGame = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);

  // --- Estados de Configuração ---
  const [difficulty, setDifficulty] = useState("easy");
  const [gameState, setGameState] = useState("setup");
  const [score, setScore] = useState(0);

  // ⭐⭐⭐ NOVO REF PARA O LOOP ⭐⭐⭐
  // O 'useRef' é lido de forma síncrona pelo loop
  const gameStateRef = useRef("setup");

  const { userCoins, addCoins } = useApp();
  const [rewardMessage, setRewardMessage] = useState("");

  // --- Refs para o Estado do Jogo (Sem mudança) ---
  const snakeRef = useRef(STARTING_SNAKE);
  const directionRef = useRef(STARTING_DIRECTION);
  const foodRef = useRef({ x: 0, y: 0 });
  const directionBufferRef = useRef(STARTING_DIRECTION);

  // --- Funções de Lógica do Jogo (Agora com useCallback) ---

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
  }, []); // Dependência vazia, só é criada uma vez

  const checkCollision = useCallback((head) => {
    const maxX = CANVAS_WIDTH / GRID_SIZE;
    const maxY = CANVAS_HEIGHT / GRID_SIZE;
    if (head.x < 0 || head.x >= maxX || head.y < 0 || head.y >= maxY) {
      return true;
    }
    for (let i = 1; i < snakeRef.current.length; i++) {
      if (
        head.x === snakeRef.current[i].x &&
        head.y === snakeRef.current[i].y
      ) {
        return true;
      }
    }
    return false;
  }, []); // Dependência vazia

  // --- Função de Desenho (Agora com useCallback) ---
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
  }, []); // Dependência vazia

  // --- Funções de Controle (Agora com useCallback) ---

  const endGame = useCallback(() => {
    clearTimeout(gameLoopRef.current);
    setGameState("gameover");
    gameStateRef.current = "gameover"; // ⭐ ATUALIZA O REF
    addCoins(score);
    setRewardMessage(`Fim de Jogo! Você fez ${score} moedas!`);
  }, [score]); // Depende do 'score' para a mensagem final

  // --- Função de Loop (Agora com useCallback e lendo o REF) ---
  const gameLoop = useCallback(() => {
    // ⭐⭐⭐ A CORREÇÃO PRINCIPAL ESTÁ AQUI ⭐⭐⭐
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
  }, [difficulty, checkCollision, draw, endGame, placeFood]); // Depende das outras funções

  const startGame = useCallback(() => {
    snakeRef.current = STARTING_SNAKE;
    directionRef.current = STARTING_DIRECTION;
    directionBufferRef.current = STARTING_DIRECTION;
    placeFood(snakeRef.current);
    setScore(0);
    setGameState("playing");
    gameStateRef.current = "playing"; // ⭐ ATUALIZA O REF
    setRewardMessage("");

    clearTimeout(gameLoopRef.current);
    gameLoopRef.current = setTimeout(gameLoop, SPEEDS[difficulty]);
  }, [difficulty, placeFood, gameLoop]); // Depende das funções

  const backToSetup = useCallback(() => {
    setGameState("setup");
    gameStateRef.current = "setup"; // ⭐ ATUALIZA O REF
    setRewardMessage("");
    const ctx = canvasRef.current.getContext("2d");
    snakeRef.current = STARTING_SNAKE;
    placeFood(STARTING_SNAKE);
    draw(ctx);
  }, [draw, placeFood]); // Depende das funções

  // --- Hooks de Efeito (useEffect) ---

  // Configura os listeners do teclado (Sem mudança)
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
  }, []); // Roda só uma vez

  // Desenha o estado inicial
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    snakeRef.current = STARTING_SNAKE;
    placeFood(STARTING_SNAKE);
    draw(ctx);
  }, [draw, placeFood]); // ⭐ Agora 'draw' e 'placeFood' são estáveis

  // --- Renderização (Sem mudança) ---
  return (
    <div className="snake-game-container">
      <div className="coin-display">Moedas: {userCoins} 💰</div>
      <h1 className="snake-game-title">Jogo da Cobrinha (Snake)</h1>

      <div className="snake-game-area">
        {gameState !== "playing" && (
          <div className="snake-overlay">
            {gameState === "setup" && (
              <div className="snake-setup">
                <h2>Configurar Jogo</h2>
                <div className="snake-option">
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
