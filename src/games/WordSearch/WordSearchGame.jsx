import React, { useState, useEffect, useRef, useCallback } from "react";
import "./WordSearch.css"; // O CSS que vamos alterar
import { useApp } from "../../contexts/AppContext";

// --- Configuração do Jogo (Sem mudança) ---
const wordLists = {
  easy: ["REACT", "VUE", "CSS", "HTML", "NODE"],
  medium: ["ANGULAR", "PYTHON", "JAVA", "SWIFT", "KOTLIN", "PHP", "RUST"],
  hard: [
    "JAVASCRIPT",
    "TYPESCRIPT",
    "SPRINGBOOT",
    "LARAVEL",
    "DJANGO",
    "FLASK",
    "NEXTJS",
  ],
  impossible: [
    "MONGODB",
    "POSTGRESQL",
    "DOCKER",
    "KUBERNETES",
    "TERRAFORM",
    "AWS",
    "AZURE",
    "GOLANG",
  ],
};
const gridSizes = { easy: 10, medium: 12, hard: 14, impossible: 15 };
const DIFFICULTIES = {
  easy: { label: "Fácil (5 palavras)", reward: 50 },
  medium: { label: "Média (7 palavras)", reward: 100 },
  hard: { label: "Difícil (7 palavras)", reward: 150 },
  impossible: { label: "Impossível (8 palavras)", reward: 250 },
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
// --- Fim da Configuração (Sem mudança) ---

// --- Funções de Geração (Sem mudança) ---
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
  for (let i = 0; i < 50 && !placed; i++) {
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
        const newR = r + l * dir[0];
        const newC = c + l * dir[1];
        grid[newR][newC] = word[l];
      }
      placed = true;
    }
  }
  return placed;
};
const generateGame = (difficulty) => {
  const size = gridSizes[difficulty];
  const words = wordLists[difficulty];
  let grid = Array(size)
    .fill(0)
    .map(() => Array(size).fill(null));
  const placedWords = [];
  for (const word of words) {
    if (placeWord(grid, word)) {
      placedWords.push(word);
    }
  }
  grid = fillGrid(grid);
  return { grid, words: placedWords };
};
// --- Fim das Funções de Geração (Sem mudança) ---

// --- Componente do Jogo ---
const WordSearchGame = () => {
  const [difficulty, setDifficulty] = useState("easy");
  const [game, setGame] = useState(generateGame("easy"));
  const [foundWords, setFoundWords] = useState([]);

  // --- Estados de Seleção (Drag) ---
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState([]); // Array de {r, c}
  const selectionWord = useRef("");

  // ⭐⭐⭐ NOVO ESTADO AQUI ⭐⭐⭐
  // Guarda todas as células de palavras já encontradas
  const [foundCells, setFoundCells] = useState([]);

  // --- Estados de Tempo e Recompensa ---
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);
  const [gameState, setGameState] = useState("setup");
  const { userCoins, addCoins } = useApp();
  const [rewardMessage, setRewardMessage] = useState("");

  // --- Lógica do Timer (Sem mudança) ---
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // --- Lógica de Vitória (Sem mudança) ---
  useEffect(() => {
    if (
      gameState === "playing" &&
      foundWords.length > 0 &&
      foundWords.length === game.words.length
    ) {
      setGameState("won");
      const reward = DIFFICULTIES[difficulty].reward;
      const timeBonus = Math.max(0, 60 - time) * 2;
      const totalReward = reward + timeBonus;
      addCoins(totalReward);
      setRewardMessage(`Você achou tudo em ${time}s! +${totalReward} moedas!`);
    }
  }, [foundWords, game.words, gameState, time, difficulty, addCoins]);

  // --- Lógica de Seleção (Drag) ---
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
    if (Math.abs(dr) === Math.abs(dc) || dr === 0 || dc === 0) {
      const newSelection = [];
      const len = Math.max(Math.abs(dr), Math.abs(dc));
      const unitDr = dr === 0 ? 0 : dr / len;
      const unitDc = dc === 0 ? 0 : dc / len;
      let word = "";
      for (let i = 0; i <= len; i++) {
        const newR = start.r + i * unitDr;
        const newC = start.c + i * unitDc;
        newSelection.push({ r: newR, c: newC });
        word += game.grid[newR][newC];
      }
      setSelection(newSelection);
      selectionWord.current = word;
    }
  };

  // ⭐⭐⭐ LÓGICA ATUALIZADA AQUI ⭐⭐⭐
  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);

    const word = selectionWord.current;
    const wordReversed = word.split("").reverse().join("");

    const checkWord = (w) => {
      return game.words.includes(w) && !foundWords.includes(w);
    };

    let wordWasFound = false;
    let foundWordString = "";

    if (checkWord(word)) {
      wordWasFound = true;
      foundWordString = word;
    } else if (checkWord(wordReversed)) {
      wordWasFound = true;
      foundWordString = wordReversed;
    }

    if (wordWasFound) {
      setFoundWords((prev) => [...prev, foundWordString]);
      // Salva as células da seleção atual no estado 'foundCells'
      setFoundCells((prev) => [...prev, ...selection]);
    }

    setSelection([]); // Limpa a seleção visual *atual*
    selectionWord.current = "";
  };

  // --- Funções Auxiliares ---
  const startGame = () => {
    setGameState("playing");
    setTime(0);
  };

  // ⭐⭐⭐ LÓGICA ATUALIZADA AQUI ⭐⭐⭐
  const restartGame = (newDifficulty) => {
    const diff = newDifficulty || difficulty;
    setDifficulty(diff);
    setGame(generateGame(diff));
    setFoundWords([]);
    setSelection([]);
    setFoundCells([]); // Limpa as células encontradas
    setIsSelecting(false);
    setGameState("setup");
    setTime(0);
    setRewardMessage("");
  };

  // ⭐⭐⭐ LÓGICA ATUALIZADA AQUI ⭐⭐⭐
  // Nova função para definir a classe da célula
  const getCellClassName = (r, c) => {
    // 1. Checa se está permanentemente encontrada (Verde)
    if (foundCells.some((cell) => cell.r === r && cell.c === c)) {
      return "found";
    }
    // 2. Checa se está sendo selecionada agora (Azul)
    if (selection.some((cell) => cell.r === r && cell.c === c)) {
      return "selected";
    }
    // 3. Classe padrão
    return "";
  };

  return (
    <div
      className="ws-game-container"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="coin-display">Moedas: {userCoins} 💰</div>
      <h1 className="ws-game-title">Caça-Palavras</h1>
      <div className="ws-main-area">
        <div
          className="ws-grid-wrapper"
          style={{ "--grid-size": gridSizes[difficulty] }}
        >
          <div className="ws-grid">
            {game.grid.map((row, r) =>
              row.map((letter, c) => (
                <div
                  key={`${r}-${c}`}
                  // ⭐⭐⭐ LÓGICA ATUALIZADA AQUI ⭐⭐⭐
                  className={`ws-cell ${getCellClassName(r, c)}`}
                  onMouseDown={() => handleMouseDown(r, c)}
                  onMouseEnter={() => handleMouseEnter(r, c)}
                >
                  {letter}
                </div>
              ))
            )}
          </div>

          {/* --- Overlay (Sem mudança) --- */}
          {gameState !== "playing" && (
            <div className="ws-overlay">
              {gameState === "setup" && (
                <div className="ws-setup">
                  <h2>Caça-Palavras</h2>
                  <div className="difficulty-selector ws">
                    {Object.keys(DIFFICULTIES).map((level) => (
                      <button
                        key={level}
                        className={difficulty === level ? "active" : ""}
                        onClick={() => restartGame(level)}
                      >
                        {DIFFICULTIES[level].label}
                      </button>
                    ))}
                  </div>
                  <button className="ws-start-button" onClick={startGame}>
                    Começar
                  </button>
                </div>
              )}
              {gameState === "won" && (
                <div className="ws-won-screen">
                  <h2>Parabéns!</h2>
                  <h3>{rewardMessage}</h3>
                  <button
                    className="ws-start-button"
                    onClick={() => restartGame()}
                  >
                    Jogar Novamente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- Painel de Info (Sem mudança) --- */}
        <div className="ws-info-panel">
          <h3>Encontre as Palavras:</h3>
          <ul className="ws-word-list">
            {game.words.map((word) => (
              <li
                key={word}
                className={foundWords.includes(word) ? "found" : ""}
              >
                {word}
              </li>
            ))}
          </ul>
          <div className="ws-timer">
            Tempo: <strong>{time}s</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordSearchGame;
