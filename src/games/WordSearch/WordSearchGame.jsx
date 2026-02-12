import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import "./WordSearch.css";
import { useApp } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";

// --- BANCO DE PALAVRAS EXPANDIDO ---
const ALL_WORDS = {
  tech: [
    "REACT",
    "VUE",
    "CSS",
    "HTML",
    "NODE",
    "JAVA",
    "PYTHON",
    "RUBY",
    "SWIFT",
    "KOTLIN",
    "DOCKER",
    "LINUX",
    "CLOUD",
    "API",
    "JSON",
    "GIT",
    "SQL",
    "REDIS",
    "MONGO",
    "AWS",
  ],
  nature: [
    "ARVORE",
    "FLOR",
    "RIO",
    "MAR",
    "SOL",
    "LUA",
    "PEDRA",
    "TERRA",
    "VENTO",
    "CHUVA",
    "GRAMA",
    "PEIXE",
    "GATO",
    "LEAO",
    "TIGRE",
    "ZEBRA",
    "URSO",
    "LOBO",
  ],
  food: [
    "PIZZA",
    "PAO",
    "BOLO",
    "SUCO",
    "CAFE",
    "ARROZ",
    "FEIJAO",
    "CARNE",
    "FRUTA",
    "UVA",
    "MACA",
    "PERA",
    "DOCE",
    "SAL",
    "OVO",
    "QUEIJO",
    "LEITE",
  ],
  objects: [
    "MESA",
    "CADEIRA",
    "CAMA",
    "PORTA",
    "JANELA",
    "CARRO",
    "MOTO",
    "AVIAO",
    "TREM",
    "LIVRO",
    "CANETA",
    "PAPEL",
    "COPO",
    "PRATO",
    "FACA",
  ],
};

// Configuração de Dificuldade
const DIFFICULTIES = {
  easy: { label: "Fácil", size: 10, wordCount: 5, coins: 20, xp: 40 },
  medium: { label: "Médio", size: 12, wordCount: 8, coins: 40, xp: 80 },
  hard: { label: "Difícil", size: 14, wordCount: 12, coins: 80, xp: 150 },
  impossible: {
    label: "Impossível",
    size: 16,
    wordCount: 15,
    coins: 150,
    xp: 300,
  },
};

const directions = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [-1, 1],
];

// --- GERADOR DE JOGO ---
const getRandomWords = (count) => {
  // Junta todas as categorias em um array só
  const all = [
    ...ALL_WORDS.tech,
    ...ALL_WORDS.nature,
    ...ALL_WORDS.food,
    ...ALL_WORDS.objects,
  ];
  // Embaralha e pega 'count' palavras
  return all.sort(() => 0.5 - Math.random()).slice(0, count);
};

const fillGrid = (grid) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (!grid[r][c]) {
        grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }
  return grid;
};

const placeWord = (grid, word) => {
  const size = grid.length;
  let placed = false;
  // Tenta 100 vezes colocar a palavra
  for (let i = 0; i < 100 && !placed; i++) {
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);

    let canPlace = true;
    for (let l = 0; l < word.length; l++) {
      const newR = r + l * dir[0];
      const newC = c + l * dir[1];
      if (newR < 0 || newR >= size || newC < 0 || newC >= size) {
        canPlace = false;
        break;
      }
      if (grid[newR][newC] && grid[newR][newC] !== word[l]) {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      for (let l = 0; l < word.length; l++) {
        grid[r + l * dir[0]][c + l * dir[1]] = word[l];
      }
      placed = true;
    }
  }
  return placed;
};

const generateGame = (difficultyKey) => {
  const config = DIFFICULTIES[difficultyKey];
  const size = config.size;
  // Garante palavras aleatórias a cada jogo
  const wordsToPlace = getRandomWords(config.wordCount);

  let grid = Array(size)
    .fill(0)
    .map(() => Array(size).fill(null));
  const finalWords = [];

  for (const word of wordsToPlace) {
    if (placeWord(grid, word)) {
      finalWords.push(word);
    }
  }

  grid = fillGrid(grid);
  return { grid, words: finalWords };
};

// --- COMPONENTE PRINCIPAL ---
const WordSearchGame = () => {
  const navigate = useNavigate();
  const { profile, addCoins, isAdmin } = useApp();

  // Estados
  const [difficulty, setDifficulty] = useState("easy");
  const [game, setGame] = useState(null); // Inicia null, gera no start
  const [foundWords, setFoundWords] = useState([]);
  const [foundCells, setFoundCells] = useState([]);

  // Interação
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState([]);
  const selectionWord = useRef("");

  // Controle
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);
  const [gameState, setGameState] = useState("setup"); // 'setup', 'playing', 'won'
  const [showConfirmGiveUp, setShowConfirmGiveUp] = useState(false);
  const [rewardMessage, setRewardMessage] = useState("");

  // Iniciar Timer
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // Verificar Vitória
  useEffect(() => {
    if (
      gameState === "playing" &&
      game &&
      foundWords.length === game.words.length
    ) {
      handleGameEnd();
    }
  }, [foundWords, gameState, game]);

  // --- LÓGICA DE FIM DE JOGO ---
  const handleGameEnd = async () => {
    setGameState("won");

    // Calcula recompensas
    const config = DIFFICULTIES[difficulty];
    const timeBonus = Math.max(0, 120 - time); // Bônus se terminar em menos de 2min
    const totalCoins = config.coins + Math.floor(timeBonus / 10);

    setRewardMessage(
      `Tempo: ${time}s | +${totalCoins} Moedas | +${config.xp} XP`,
    );

    if (profile) {
      try {
        await supabase.rpc("increment_stats", {
          user_id_input: profile.id,
          coins_add: totalCoins,
          xp_add: config.xp,
        });
        addCoins(totalCoins);
      } catch (err) {
        console.error("Erro ao salvar:", err);
        addCoins(totalCoins); // Fallback visual
      }
    }
  };

  const handleGiveUp = async () => {
    setShowConfirmGiveUp(false);
    setGameState("setup"); // Volta pro menu do jogo

    const penalty = 15;
    if (profile) {
      try {
        await supabase.rpc("increment_stats", {
          user_id_input: profile.id,
          coins_add: -penalty,
          xp_add: 0,
        });
        addCoins(-penalty);
        alert(`Você desistiu. -${penalty} Moedas.`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- INTERAÇÃO COM O GRID ---
  const handleMouseDown = (r, c) => {
    if (gameState !== "playing") return;
    setIsSelecting(true);
    setSelection([{ r, c }]);
    selectionWord.current = game.grid[r][c];
  };

  const handleMouseEnter = (r, c) => {
    if (!isSelecting) return;
    const start = selection[0];
    const dr = r - start.r;
    const dc = c - start.c;

    // Lógica para selecionar apenas em linha reta/diagonal
    if (Math.abs(dr) === Math.abs(dc) || dr === 0 || dc === 0) {
      const newSelection = [];
      const len = Math.max(Math.abs(dr), Math.abs(dc));
      const uDr = dr === 0 ? 0 : dr / len;
      const uDc = dc === 0 ? 0 : dc / len;

      let word = "";
      for (let i = 0; i <= len; i++) {
        const nr = start.r + i * uDr;
        const nc = start.c + i * uDc;
        newSelection.push({ r: nr, c: nc });
        word += game.grid[nr][nc];
      }
      setSelection(newSelection);
      selectionWord.current = word;
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);

    const word = selectionWord.current;
    const revWord = word.split("").reverse().join("");

    const check = (w) => game.words.includes(w) && !foundWords.includes(w);

    if (check(word) || check(revWord)) {
      const correctWord = check(word) ? word : revWord;
      setFoundWords((prev) => [...prev, correctWord]);
      setFoundCells((prev) => [...prev, ...selection]);
    }
    setSelection([]);
    selectionWord.current = "";
  };

  // --- UI CONTROL ---
  const startGame = () => {
    setGame(generateGame(difficulty));
    setFoundWords([]);
    setFoundCells([]);
    setSelection([]);
    setTime(0);
    setGameState("playing");
  };

  const getCellClass = (r, c) => {
    if (foundCells.some((cell) => cell.r === r && cell.c === c)) return "found";
    if (selection.some((cell) => cell.r === r && cell.c === c))
      return "selected";
    return "";
  };

  return (
    <div
      className="ws-game-container"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* TOP BAR */}
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

      <h1 className="ws-game-title">Caça-Palavras</h1>

      <div className="ws-main-area">
        {/* LADO ESQUERDO: GRID */}
        <div
          className="ws-grid-wrapper"
          style={{ "--grid-size": game ? game.grid.length : 10 }}
        >
          {gameState === "playing" ? (
            <div className="ws-grid">
              {game.grid.map((row, r) =>
                row.map((char, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`ws-cell ${getCellClass(r, c)}`}
                    onMouseDown={() => handleMouseDown(r, c)}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                  >
                    {char}
                  </div>
                )),
              )}
            </div>
          ) : (
            // Placeholder vazio enquanto não joga
            <div
              style={{
                width: 400,
                height: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#555",
              }}
            >
              Escolha a dificuldade para começar
            </div>
          )}

          {/* OVERLAYS (MENU / VITÓRIA) */}
          {gameState !== "playing" && (
            <div className="ws-overlay">
              {gameState === "setup" && (
                <div className="ws-setup">
                  <h2>Nova Partida</h2>
                  <div className="difficulty-selector ws">
                    {Object.keys(DIFFICULTIES).map((key) => {
                      // Trava impossível para não admins (opcional)
                      const isLocked = key === "impossible" && !isAdmin;
                      return (
                        <button
                          key={key}
                          className={difficulty === key ? "active" : ""}
                          onClick={() => setDifficulty(key)}
                          disabled={isLocked}
                        >
                          <span>{DIFFICULTIES[key].label}</span>
                          <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                            {DIFFICULTIES[key].wordCount} palavras
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button className="ws-start-button" onClick={startGame}>
                    JOGAR
                  </button>
                </div>
              )}

              {gameState === "won" && (
                <div className="ws-won-screen">
                  <h2>Parabéns! 🎉</h2>
                  <p
                    style={{
                      marginBottom: "20px",
                      fontSize: "1.2rem",
                      color: "#ccc",
                    }}
                  >
                    {rewardMessage}
                  </p>
                  <button
                    className="ws-start-button"
                    onClick={() => setGameState("setup")}
                  >
                    Menu Principal
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LADO DIREITO: LISTA DE PALAVRAS */}
        {gameState === "playing" && (
          <div className="ws-info-panel">
            <h3>
              Palavras ({foundWords.length}/{game.words.length})
            </h3>
            <ul className="ws-word-list">
              {game.words.map((w) => (
                <li key={w} className={foundWords.includes(w) ? "found" : ""}>
                  {w}
                </li>
              ))}
            </ul>
            <div className="ws-timer">
              Tempo: <strong>{time}s</strong>
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

export default WordSearchGame;
