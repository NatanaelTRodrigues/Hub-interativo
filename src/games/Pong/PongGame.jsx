import React, { useRef, useEffect, useState, useCallback } from "react";
import "./Pong.css";
import { useApp } from "../../contexts/AppContext";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

// --- CONFIGURAÇÃO DA LOJA ---
// Cores disponíveis para Raquetes e Campo
const COLORS = [
  { id: "classic_blue", name: "Azul Clássico", color: "#4d90fe", cost: 0 },
  { id: "red", name: "Vermelho", color: "#ff5252", cost: 0 }, // Grátis para P2/Bot
  { id: "green", name: "Verde Matrix", color: "#00ff41", cost: 50 },
  { id: "purple", name: "Cyber Roxo", color: "#bd00ff", cost: 100 },
  { id: "gold", name: "Ouro Real", color: "#ffd700", cost: 500 },
  { id: "white", name: "Branco Puro", color: "#ffffff", cost: 150 },
  { id: "dark", name: "Preto Profundo", color: "#111111", cost: 0 }, // Para o campo
  { id: "navy", name: "Azul Marinho", color: "#0a192f", cost: 50 },
];

const BALLS = [
  { id: "classic_ball", name: "Clássica", color: "#ffd700", cost: 0 },
  { id: "white_ball", name: "Branca", color: "#ffffff", cost: 20 },
  { id: "neon_ball", name: "Neon", color: "#00ffcc", cost: 100 },
  { id: "fire_ball", name: "Fogo", color: "#ff4500", cost: 200 },
];

// --- FÍSICA E DIFICULDADE (AJUSTADA) ---
const CANVAS_WIDTH = 900; // Maior
const CANVAS_HEIGHT = 600; // Maior
const PADDLE_WIDTH = 18;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 16;
const PADDLE_SPEED = 9;

// Dificuldade reduzida para ser mais justo
const BOT_SPEEDS = {
  easy: 2.5,
  medium: 4.5, // Antes era 5
  hard: 6.0, // Antes era 7
  impossible: 10, // Quase inalcançável
};
const difficultyLevels = ["easy", "medium", "hard", "impossible"];

const keysPressed = {};

const PongGame = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const { userCoins, addCoins, isAdmin, profile } = useApp();

  // --- ESTADOS DO JOGO ---
  const [gameMode, setGameMode] = useState("pvc"); // 'pvc' ou 'pvp'
  const [difficulty, setDifficulty] = useState("medium");
  const [maxScore, setMaxScore] = useState(5);
  const [gameState, setGameState] = useState("setup"); // setup, playing, gameover
  const [rewardMessage, setRewardMessage] = useState("");
  const [showConfirmGiveUp, setShowConfirmGiveUp] = useState(false);

  // --- ESTADOS DA LOJA / CUSTOMIZAÇÃO ---
  // Player 1 (Sempre controlado pelo usuário)
  const [p1Paddle, setP1Paddle] = useState(COLORS[0]); // Azul
  const [p1Field, setP1Field] = useState(COLORS[6]); // Preto

  // Player 2 (Controlado pelo Usuário no PvP ou Bot no PvC)
  const [p2Paddle, setP2Paddle] = useState(COLORS[1]); // Vermelho
  const [p2Field, setP2Field] = useState(COLORS[6]); // Preto

  // Bola (Sempre escolhida pelo usuário)
  const [ballItem, setBallItem] = useState(BALLS[0]);

  const [activeTab, setActiveTab] = useState("p1"); // p1, p2, ball

  // Inventário Local
  const [ownedItems, setOwnedItems] = useState(() => {
    const saved = localStorage.getItem(
      `pong_inventory_${profile?.id || "guest"}`,
    );
    return saved
      ? JSON.parse(saved)
      : ["classic_blue", "red", "dark", "classic_ball"];
  });

  // Refs de Posição
  const gameStateRef = useRef("setup");
  const player1Ref = useRef({ y: 250, score: 0 });
  const player2Ref = useRef({ y: 250, score: 0 });
  const ballRef = useRef({ x: 450, y: 300, dx: 6, dy: 6 });

  // Salvar inventário
  useEffect(() => {
    if (profile?.id) {
      localStorage.setItem(
        `pong_inventory_${profile.id}`,
        JSON.stringify(ownedItems),
      );
    }
  }, [ownedItems, profile]);

  // --- LÓGICA DE COMPRA E SELEÇÃO ---
  const handleSelectItem = (item, type) => {
    const isOwned = ownedItems.includes(item.id);

    if (isOwned) {
      // Equipar
      if (type === "p1_paddle") setP1Paddle(item);
      if (type === "p1_field") setP1Field(item);
      if (type === "p2_paddle") setP2Paddle(item);
      if (type === "p2_field") setP2Field(item);
      if (type === "ball") setBallItem(item);
    } else {
      // Comprar
      if (userCoins >= item.cost) {
        if (window.confirm(`Comprar ${item.name} por ${item.cost} moedas?`)) {
          addCoins(-item.cost);
          setOwnedItems((prev) => [...prev, item.id]);
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

  // --- ENGINE DO JOGO ---

  const resetBall = (direction) => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: 6 * direction,
      dy: (Math.random() > 0.5 ? 1 : -1) * 6,
    };
  };

  const startGame = () => {
    player1Ref.current = { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0 };
    player2Ref.current = { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0 };

    // --- RANDOMIZAÇÃO DO BOT (Apenas PvC) ---
    if (gameMode === "pvc") {
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      setP2Paddle(randomColor);

      // Randomiza campo do bot também (opcional, pode ser só preto)
      const randomField = [COLORS[6], COLORS[7]][Math.floor(Math.random() * 2)]; // Preto ou Navy
      setP2Field(randomField);
    }

    resetBall(Math.random() > 0.5 ? 1 : -1);
    setRewardMessage("");
    setGameState("playing");
    gameStateRef.current = "playing";
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const draw = useCallback(
    (ctx) => {
      // 1. DESENHAR CAMPO DIVIDIDO
      // Lado Esquerdo (P1)
      ctx.fillStyle = p1Field.color;
      ctx.fillRect(0, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      // Lado Direito (P2)
      ctx.fillStyle = p2Field.color;
      ctx.fillRect(CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT);

      // Linha Central
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(CANVAS_WIDTH / 2 - 2, 0, 4, CANVAS_HEIGHT);

      // 2. DESENHAR RAQUETES
      // Player 1
      ctx.fillStyle = p1Paddle.color;
      ctx.fillRect(15, player1Ref.current.y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Player 2
      ctx.fillStyle = p2Paddle.color;
      ctx.fillRect(
        CANVAS_WIDTH - PADDLE_WIDTH - 15,
        player2Ref.current.y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
      );

      // 3. DESENHAR BOLA
      ctx.fillStyle = ballItem.color;
      ctx.beginPath();
      ctx.arc(
        ballRef.current.x,
        ballRef.current.y,
        BALL_SIZE / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // 4. PLACAR
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "80px sans-serif";
      ctx.fillText(player1Ref.current.score, CANVAS_WIDTH / 4, 100);
      ctx.fillText(player2Ref.current.score, (CANVAS_WIDTH / 4) * 3, 100);
    },
    [p1Field, p2Field, p1Paddle, p2Paddle, ballItem],
  );

  const update = useCallback(() => {
    const ball = ballRef.current;
    const p1 = player1Ref.current;
    const p2 = player2Ref.current;

    // Controles P1 (W/S)
    if (keysPressed["w"] && p1.y > 0) p1.y -= PADDLE_SPEED;
    if (keysPressed["s"] && p1.y < CANVAS_HEIGHT - PADDLE_HEIGHT)
      p1.y += PADDLE_SPEED;

    // Controles P2 ou Bot
    if (gameMode === "pvp") {
      if (keysPressed["ArrowUp"] && p2.y > 0) p2.y -= PADDLE_SPEED;
      if (keysPressed["ArrowDown"] && p2.y < CANVAS_HEIGHT - PADDLE_HEIGHT)
        p2.y += PADDLE_SPEED;
    } else {
      // IA
      const speed = BOT_SPEEDS[difficulty];
      const center = p2.y + PADDLE_HEIGHT / 2;
      // Erro humano baseado na dificuldade
      const errorMargin =
        difficulty === "impossible" ? 0 : difficulty === "hard" ? 15 : 30;

      if (center < ball.y - errorMargin && p2.y < CANVAS_HEIGHT - PADDLE_HEIGHT)
        p2.y += speed;
      else if (center > ball.y + errorMargin && p2.y > 0) p2.y -= speed;
    }

    // Física Bola
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Colisão Paredes Y
    if (ball.y < BALL_SIZE / 2 || ball.y > CANVAS_HEIGHT - BALL_SIZE / 2)
      ball.dy = -ball.dy;

    // Colisão Raquetes
    // P1
    if (
      ball.x < 15 + PADDLE_WIDTH + BALL_SIZE / 2 &&
      ball.y > p1.y &&
      ball.y < p1.y + PADDLE_HEIGHT
    ) {
      ball.dx = Math.abs(ball.dx) * 1.05;
      ball.x = 15 + PADDLE_WIDTH + BALL_SIZE / 2 + 2;
    }
    // P2
    if (
      ball.x > CANVAS_WIDTH - 15 - PADDLE_WIDTH - BALL_SIZE / 2 &&
      ball.y > p2.y &&
      ball.y < p2.y + PADDLE_HEIGHT
    ) {
      ball.dx = -Math.abs(ball.dx) * 1.05;
      ball.x = CANVAS_WIDTH - 15 - PADDLE_WIDTH - BALL_SIZE / 2 - 2;
    }

    // Pontos
    if (ball.x < 0) {
      p2.score++;
      resetBall(1);
    }
    if (ball.x > CANVAS_WIDTH) {
      p1.score++;
      resetBall(-1);
    }

    // Fim de Jogo
    if (p1.score >= maxScore || p2.score >= maxScore) {
      endGame();
    }
  }, [gameMode, difficulty, maxScore]);

  const endGame = useCallback(async () => {
    if (gameStateRef.current !== "playing") return;
    setGameState("gameover");
    gameStateRef.current = "gameover";
    cancelAnimationFrame(gameLoopRef.current);

    const p1 = player1Ref.current.score;
    const p2 = player2Ref.current.score;

    if (gameMode === "pvc" && p1 > p2) {
      const diffIndex = difficultyLevels.indexOf(difficulty);
      const coins = maxScore * (diffIndex + 1) * 3;
      const xp = coins * 2;

      setRewardMessage(`Vitória! +${coins} Moedas | +${xp} XP`);

      if (profile) {
        addCoins(coins);
        try {
          await supabase.rpc("increment_stats", {
            user_id_input: profile.id,
            coins_add: coins,
            xp_add: xp,
          });
        } catch (e) {
          console.error(e);
        }
      }
    } else if (gameMode === "pvc") {
      setRewardMessage("Derrota. O Bot venceu!");
    } else {
      const winner = p1 > p2 ? "Jogador 1" : "Jogador 2";
      setRewardMessage(`${winner} Venceu! (PvP sem prêmios)`);
    }
  }, [gameMode, difficulty, maxScore, profile, addCoins]);

  const handleGiveUp = async () => {
    setShowConfirmGiveUp(false);
    setGameState("setup");
    gameStateRef.current = "setup";
    cancelAnimationFrame(gameLoopRef.current);

    const penalty = 15;
    if (profile) {
      addCoins(-penalty);
      try {
        await supabase.rpc("increment_stats", {
          user_id_input: profile.id,
          coins_add: -penalty,
          xp_add: 0,
        });
      } catch (e) {
        console.error(e);
      }
    }
    alert(`Você desistiu da partida. -${penalty} moedas.`);
  };

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    update();
    draw(ctx);
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [update, draw]);

  // Listeners Teclado (Bloqueia Scroll)
  useEffect(() => {
    const down = (e) => {
      if (["ArrowUp", "ArrowDown", "w", "s"].includes(e.key))
        e.preventDefault();
      keysPressed[e.key] = true;
    };
    const up = (e) => (keysPressed[e.key] = false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  // Desenho Preview
  useEffect(() => {
    if (gameState === "setup" && canvasRef.current) {
      draw(canvasRef.current.getContext("2d"));
    }
  }, [draw, gameState]);

  return (
    <div className="pong-game-container">
      <div className="top-bar">
        <button className="action-text-btn" onClick={() => navigate("/jogos")}>
          ← Voltar
        </button>
        {gameState === "playing" && (
          <button
            className="action-text-btn give-up-btn"
            onClick={() => setShowConfirmGiveUp(true)}
          >
            🏳️ Desistir
          </button>
        )}
      </div>

      <h1 className="pong-game-title">Pong Arena</h1>

      <div className="pong-game-area">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

        {gameState === "setup" && (
          <div className="pong-overlay">
            <div className="pong-menu-content">
              {/* CONFIGURAÇÕES DE PARTIDA */}
              <div className="pong-setup-section">
                <div className="pong-option-group">
                  <label>Modo</label>
                  <div className="pong-btn-row">
                    <button
                      className={`pong-btn ${gameMode === "pvc" ? "active" : ""}`}
                      onClick={() => setGameMode("pvc")}
                    >
                      Bot
                    </button>
                    <button
                      className={`pong-btn ${gameMode === "pvp" ? "active" : ""}`}
                      onClick={() => setGameMode("pvp")}
                    >
                      PvP
                    </button>
                  </div>
                </div>

                {gameMode === "pvc" && (
                  <div className="pong-option-group">
                    <label>Dificuldade</label>
                    <div className="pong-btn-row">
                      {difficultyLevels.map((d) => (
                        <button
                          key={d}
                          className={`pong-btn ${difficulty === d ? "active" : ""}`}
                          onClick={() => setDifficulty(d)}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pong-option-group">
                  <label>Pontos</label>
                  <div className="pong-btn-row">
                    {[3, 5, 10].map((s) => (
                      <button
                        key={s}
                        className={`pong-btn ${maxScore === s ? "active" : ""}`}
                        onClick={() => setMaxScore(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* LOJA E CUSTOMIZAÇÃO */}
              <div className="shop-section">
                <div className="shop-tabs">
                  <button
                    className={`shop-tab ${activeTab === "p1" ? "active" : ""}`}
                    onClick={() => setActiveTab("p1")}
                  >
                    Player 1
                  </button>
                  {gameMode === "pvp" && (
                    <button
                      className={`shop-tab ${activeTab === "p2" ? "active" : ""}`}
                      onClick={() => setActiveTab("p2")}
                    >
                      Player 2
                    </button>
                  )}
                  <button
                    className={`shop-tab ${activeTab === "ball" ? "active" : ""}`}
                    onClick={() => setActiveTab("ball")}
                  >
                    Bola
                  </button>
                </div>

                <div className="shop-grid">
                  {/* ITENS PLAYER 1 */}
                  {activeTab === "p1" && (
                    <>
                      <h4
                        style={{ width: "100%", color: "#888", marginTop: 0 }}
                      >
                        Raquetes
                      </h4>
                      {COLORS.map((item) => (
                        <ShopItem
                          key={`p1p-${item.id}`}
                          item={item}
                          selected={p1Paddle}
                          owned={ownedItems}
                          onClick={() => handleSelectItem(item, "p1_paddle")}
                        />
                      ))}
                      <h4
                        style={{
                          width: "100%",
                          color: "#888",
                          marginTop: "10px",
                        }}
                      >
                        Campo (Lado Esq.)
                      </h4>
                      {COLORS.map((item) => (
                        <ShopItem
                          key={`p1f-${item.id}`}
                          item={item}
                          selected={p1Field}
                          owned={ownedItems}
                          onClick={() => handleSelectItem(item, "p1_field")}
                        />
                      ))}
                    </>
                  )}

                  {/* ITENS PLAYER 2 (SÓ PVP) */}
                  {activeTab === "p2" && gameMode === "pvp" && (
                    <>
                      <h4
                        style={{ width: "100%", color: "#888", marginTop: 0 }}
                      >
                        Raquetes
                      </h4>
                      {COLORS.map((item) => (
                        <ShopItem
                          key={`p2p-${item.id}`}
                          item={item}
                          selected={p2Paddle}
                          owned={ownedItems}
                          onClick={() => handleSelectItem(item, "p2_paddle")}
                        />
                      ))}
                      <h4
                        style={{
                          width: "100%",
                          color: "#888",
                          marginTop: "10px",
                        }}
                      >
                        Campo (Lado Dir.)
                      </h4>
                      {COLORS.map((item) => (
                        <ShopItem
                          key={`p2f-${item.id}`}
                          item={item}
                          selected={p2Field}
                          owned={ownedItems}
                          onClick={() => handleSelectItem(item, "p2_field")}
                        />
                      ))}
                    </>
                  )}

                  {/* ITENS BOLA */}
                  {activeTab === "ball" &&
                    BALLS.map((item) => (
                      <ShopItem
                        key={item.id}
                        item={item}
                        selected={ballItem}
                        owned={ownedItems}
                        onClick={() => handleSelectItem(item, "ball")}
                      />
                    ))}
                </div>
              </div>

              <button className="pong-start-button" onClick={startGame}>
                JOGAR
              </button>

              <div className="pong-controls-info">
                <span>
                  Player 1: <strong>W / S</strong>
                </span>
                {gameMode === "pvp" && (
                  <span>
                    Player 2: <strong>Setas</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER */}
        {gameState === "gameover" && (
          <div className="pong-overlay">
            <div className="pong-gameover">
              <h2>FIM DE JOGO</h2>
              <h3>{rewardMessage}</h3>
              <button
                className="pong-start-button"
                onClick={() => {
                  setGameState("setup");
                  gameStateRef.current = "setup";
                }}
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DESISTIR */}
      {showConfirmGiveUp && (
        <div className="game-modal">
          <h2>Desistir?</h2>
          <p>
            Você perderá <strong>15 Moedas</strong>.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <button
              className="modal-btn"
              onClick={() => setShowConfirmGiveUp(false)}
              style={{ background: "#555" }}
            >
              Cancelar
            </button>
            <button className="modal-btn danger" onClick={handleGiveUp}>
              Sim, Desistir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Item Simples da Loja
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
        <div className="item-owned">Equipado</div>
      ) : (
        <div className="item-cost">{item.cost} 💰</div>
      )}
    </div>
  );
};

export default PongGame;
