import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import "./Snake.css";
import { useApp } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";

// --- CONFIGURAÇÃO DA LOJA (ITEMS) ---
const SKINS = [
  { id: "classic", name: "Clássico", color: "#2f9e44", cost: 0 },
  { id: "blue", name: "Neon Blue", color: "#00f2ff", cost: 50 },
  { id: "purple", name: "Cyber Roxo", color: "#bd00ff", cost: 100 },
  { id: "gold", name: "Ouro Puro", color: "#ffd700", cost: 500 },
  { id: "fire", name: "Magma", color: "#ff4500", cost: 250 },
];

const FOODS = [
  { id: "apple", name: "Maçã", color: "#ff6b6b", cost: 0 },
  { id: "blueberry", name: "Mirtilo", color: "#4d90fe", cost: 50 },
  { id: "orange", name: "Laranja", color: "#ff9f43", cost: 80 },
  { id: "golden_apple", name: "Maçã Dourada", color: "#ffd700", cost: 300 },
];

const MAPS = [
  { id: "dark", name: "Escuro", color: "#1a1a1a", cost: 0 },
  { id: "grid", name: "Grid Retro", color: "#0f0f23", cost: 100 }, // Apenas muda cor de fundo por enquanto
  { id: "forest", name: "Floresta", color: "#0a2f0a", cost: 150 },
  { id: "midnight", name: "Meia-noite", color: "#000000", cost: 200 },
];

const GRID_SIZE = 20;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const SPEEDS = { easy: 180, medium: 120, hard: 80, impossible: 50 };

const SnakeGame = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const { profile, userCoins, addCoins } = useApp();

  // --- ESTADOS DO JOGO ---
  const [gameState, setGameState] = useState("setup"); // setup, playing, gameover
  const [difficulty, setDifficulty] = useState("medium");
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0); // Moedas ganhas NA PARTIDA

  // --- ESTADOS DA LOJA ---
  const [activeTab, setActiveTab] = useState("snake"); // snake, food, map
  const [selectedSkin, setSelectedSkin] = useState(SKINS[0]);
  const [selectedFood, setSelectedFood] = useState(FOODS[0]);
  const [selectedMap, setSelectedMap] = useState(MAPS[0]);

  // Inventário Local (Simples persistência via LocalStorage para itens comprados)
  const [ownedItems, setOwnedItems] = useState(() => {
    const saved = localStorage.getItem(
      `snake_inventory_${profile?.id || "guest"}`,
    );
    return saved ? JSON.parse(saved) : ["classic", "apple", "dark"];
  });

  // Refs de Jogo
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const directionRef = useRef({ dx: 1, dy: 0 });
  const nextDirectionRef = useRef({ dx: 1, dy: 0 });
  const foodRef = useRef({ x: 15, y: 10 });

  // Salvar inventário sempre que mudar
  useEffect(() => {
    if (profile?.id) {
      localStorage.setItem(
        `snake_inventory_${profile.id}`,
        JSON.stringify(ownedItems),
      );
    }
  }, [ownedItems, profile]);

  // --- LÓGICA DE COMPRA ---
  const handleSelectItem = (item, type) => {
    const isOwned = ownedItems.includes(item.id);

    if (isOwned) {
      // Equipar
      if (type === "snake") setSelectedSkin(item);
      if (type === "food") setSelectedFood(item);
      if (type === "map") setSelectedMap(item);
    } else {
      // Comprar
      if (userCoins >= item.cost) {
        if (window.confirm(`Comprar ${item.name} por ${item.cost} moedas?`)) {
          // Desconta moedas no contexto global
          addCoins(-item.cost);

          // Adiciona ao inventário local
          setOwnedItems((prev) => [...prev, item.id]);

          // Atualiza no banco a dedução (para persistir a gastança)
          if (profile) {
            supabase.rpc("increment_stats", {
              user_id_input: profile.id,
              coins_add: -item.cost,
              xp_add: 0,
            });
          }
        }
      } else {
        alert("Moedas insuficientes!");
      }
    }
  };

  // --- LÓGICA DO JOGO ---

  const placeFood = useCallback((snake) => {
    const maxX = CANVAS_WIDTH / GRID_SIZE;
    const maxY = CANVAS_HEIGHT / GRID_SIZE;
    let newFood;
    let isOnSnake = true;

    while (isOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY),
      };
      // eslint-disable-next-line
      isOnSnake = snake.some((s) => s.x === newFood.x && s.y === newFood.y);
    }
    foodRef.current = newFood;
  }, []);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCoinsEarned(0);
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    directionRef.current = { dx: 1, dy: 0 };
    nextDirectionRef.current = { dx: 1, dy: 0 };
    placeFood(snakeRef.current);

    // Focar no canvas para capturar teclado
    if (canvasRef.current) canvasRef.current.focus();
  };

  const endGame = useCallback(async () => {
    setGameState("gameover");

    // CALCULAR RECOMPENSAS FINAIS
    // Moedas já foram acumuladas em 'coinsEarned' durante o jogo
    // XP é baseado no Score
    const xpGained = Math.floor(score * 1.5);

    if (profile) {
      try {
        await supabase.rpc("increment_stats", {
          user_id_input: profile.id,
          coins_add: coinsEarned,
          xp_add: xpGained,
        });
        // Atualiza visualmente o contexto
        addCoins(coinsEarned);
      } catch (err) {
        console.error("Erro ao salvar progresso snake:", err);
      }
    }
  }, [score, coinsEarned, profile, addCoins]);

  // Game Loop
  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;

    // Atualiza direção
    directionRef.current = nextDirectionRef.current;

    const snake = [...snakeRef.current];
    const head = {
      x: snake[0].x + directionRef.current.dx,
      y: snake[0].y + directionRef.current.dy,
    };

    // Colisão Paredes
    const maxX = CANVAS_WIDTH / GRID_SIZE;
    const maxY = CANVAS_HEIGHT / GRID_SIZE;

    // Se bater na parede, morre (ou poderia atravessar dependendo do modo, mas aqui morre)
    if (head.x < 0 || head.x >= maxX || head.y < 0 || head.y >= maxY) {
      endGame();
      return;
    }

    // Colisão Corpo
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    snake.unshift(head); // Adiciona nova cabeça

    // Comer Fruta
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      // 1. Ganha Pontos
      const points =
        difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30;
      const newScore = score + points;
      setScore(newScore);

      // 2. Ganha Moeda (1 por fruta)
      let bonusCoins = 1;

      // 3. Verifica Bônus de Meta (A cada 100 pontos ganha +10 moedas)
      if (Math.floor(newScore / 100) > Math.floor(score / 100)) {
        bonusCoins += 10;
        // Efeito visual de bônus poderia ser adicionado aqui
      }

      setCoinsEarned((prev) => prev + bonusCoins);

      placeFood(snake);
    } else {
      snake.pop(); // Remove cauda se não comeu
    }

    snakeRef.current = snake;
    draw();

    // Velocidade
    gameLoopRef.current = setTimeout(gameLoop, SPEEDS[difficulty]);
  }, [gameState, difficulty, score, endGame, placeFood]);

  // Loop trigger
  useEffect(() => {
    if (gameState === "playing") {
      clearTimeout(gameLoopRef.current);
      gameLoop();
    }
    return () => clearTimeout(gameLoopRef.current);
  }, [gameLoop, gameState]);

  // Input Teclado (Com Prevenção de Scroll)
  useEffect(() => {
    const handleKey = (e) => {
      // PREVINE SCROLL DA TELA
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1
      ) {
        e.preventDefault();
      }

      if (gameState !== "playing") return;

      const current = directionRef.current;
      switch (e.key) {
        case "ArrowUp":
          if (current.dy === 0) nextDirectionRef.current = { dx: 0, dy: -1 };
          break;
        case "ArrowDown":
          if (current.dy === 0) nextDirectionRef.current = { dx: 0, dy: 1 };
          break;
        case "ArrowLeft":
          if (current.dx === 0) nextDirectionRef.current = { dx: -1, dy: 0 };
          break;
        case "ArrowRight":
          if (current.dx === 0) nextDirectionRef.current = { dx: 1, dy: 0 };
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState]);

  // Função de Desenho
  const draw = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    // Fundo
    ctx.fillStyle = selectedMap.color;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid (Opcional, se o mapa for 'grid')
    if (selectedMap.id === "grid") {
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1;
      for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    }

    // Comida
    ctx.fillStyle = selectedFood.color;
    const fx = foodRef.current.x * GRID_SIZE;
    const fy = foodRef.current.y * GRID_SIZE;
    // Desenha comida redonda
    ctx.beginPath();
    ctx.arc(
      fx + GRID_SIZE / 2,
      fy + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Cobra
    ctx.fillStyle = selectedSkin.color;
    snakeRef.current.forEach((seg, i) => {
      // Leve efeito de sombra/brilho
      ctx.fillRect(
        seg.x * GRID_SIZE + 1,
        seg.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
      );
    });
  };

  // Desenhar frame inicial
  useEffect(() => {
    if (gameState === "setup" && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = selectedMap.color;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, [selectedMap, gameState]);

  return (
    <div className="snake-game-container">
      {/* HEADER */}
      <h1 className="snake-game-title">Snake Master</h1>

      <div className="snake-game-area">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

        {/* OVERLAY: SETUP / LOJA */}
        {gameState === "setup" && (
          <div className="snake-overlay">
            <div className="snake-menu-content">
              <h2>Preparação</h2>
              <p style={{ color: "#ffd700", marginBottom: "20px" }}>
                Suas Moedas: {userCoins} 💰
              </p>

              {/* DIFICULDADE */}
              <div className="diff-row">
                {["easy", "medium", "hard", "impossible"].map((d) => (
                  <button
                    key={d}
                    className={`diff-btn ${difficulty === d ? "active" : ""}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* LOJA TABS */}
              <div className="shop-tabs">
                <button
                  className={`shop-tab ${activeTab === "snake" ? "active" : ""}`}
                  onClick={() => setActiveTab("snake")}
                >
                  Cobras
                </button>
                <button
                  className={`shop-tab ${activeTab === "food" ? "active" : ""}`}
                  onClick={() => setActiveTab("food")}
                >
                  Frutas
                </button>
                <button
                  className={`shop-tab ${activeTab === "map" ? "active" : ""}`}
                  onClick={() => setActiveTab("map")}
                >
                  Mapas
                </button>
              </div>

              {/* GRID DA LOJA */}
              <div className="shop-grid">
                {activeTab === "snake" &&
                  SKINS.map((item) => (
                    <ShopItem
                      key={item.id}
                      item={item}
                      selected={selectedSkin}
                      owned={ownedItems}
                      onClick={() => handleSelectItem(item, "snake")}
                    />
                  ))}
                {activeTab === "food" &&
                  FOODS.map((item) => (
                    <ShopItem
                      key={item.id}
                      item={item}
                      selected={selectedFood}
                      owned={ownedItems}
                      onClick={() => handleSelectItem(item, "food")}
                    />
                  ))}
                {activeTab === "map" &&
                  MAPS.map((item) => (
                    <ShopItem
                      key={item.id}
                      item={item}
                      selected={selectedMap}
                      owned={ownedItems}
                      onClick={() => handleSelectItem(item, "map")}
                    />
                  ))}
              </div>

              <button className="start-btn" onClick={startGame}>
                JOGAR
              </button>
              <button
                className="action-text-btn"
                onClick={() => navigate("/jogos")}
              >
                Sair
              </button>
            </div>
          </div>
        )}

        {/* OVERLAY: GAME OVER */}
        {gameState === "gameover" && (
          <div className="snake-overlay">
            <div className="gameover-box">
              <h2>GAME OVER</h2>
              <div className="gameover-stats">
                <p>Pontuação: {score}</p>
                <p style={{ color: "#ffd700" }}>
                  Moedas Ganhas: +{coinsEarned}
                </p>
                <p style={{ color: "#00e676" }}>
                  XP Ganho: +{Math.floor(score * 1.5)}
                </p>
              </div>
              <button
                className="start-btn"
                onClick={() => setGameState("setup")}
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE STATUS (DURANTE O JOGO) */}
      <div className="snake-stats-bar">
        <div className="stat-item">
          Pontos: <strong>{score}</strong>
        </div>
        <div className="stat-item">
          Moedas na Run: <strong>{coinsEarned}</strong>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para item da loja
const ShopItem = ({ item, selected, owned, onClick }) => {
  const isSelected = selected.id === item.id;
  const isOwned = owned.includes(item.id);

  return (
    <div
      className={`shop-item ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div
        className="item-preview"
        style={{ backgroundColor: item.color }}
      ></div>
      <div className="item-name">{item.name}</div>
      {isOwned ? (
        <div className="item-owned">Equipado/Comprado</div>
      ) : (
        <div className="item-cost">{item.cost} 💰</div>
      )}
    </div>
  );
};

export default SnakeGame;
