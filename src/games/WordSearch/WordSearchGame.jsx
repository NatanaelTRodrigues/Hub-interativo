import React, { useState, useEffect, useRef, useCallback } from "react";
import "./WordSearch.css";
import { useApp } from "../../contexts/AppContext";

// --- Configuração do Jogo ---
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

// --- Funções Auxiliares de Geração ---
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

// --- Componente Principal ---
const WordSearchGame = () => {
  // Estados do Jogo
  const [difficulty, setDifficulty] = useState("easy");
  const [game, setGame] = useState(generateGame("easy"));
  const [foundWords, setFoundWords] = useState([]);
  const [foundCells, setFoundCells] = useState([]); // Células já encontradas (Verdes)

  // Estados de Interação
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState([]);
  const selectionWord = useRef("");

  // Estados de Controle
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);
  const [gameState, setGameState] = useState("setup");
  const [rewardMessage, setRewardMessage] = useState("");

  // Contexto Global
  const { userCoins, addCoins, isAdmin } = useApp();

  // Timer
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

  // Lógica de Vitória (CORRIGIDA)
  useEffect(() => {
    if (
      gameState === "playing" &&
      foundWords.length > 0 &&
      foundWords.length === game.words.length &&
      rewardMessage === "" // Trava para não repetir
    ) {
      setGameState("won");
      const reward = DIFFICULTIES[difficulty].reward;
      const timeBonus = Math.max(0, 60 - time) * 2;
      const totalReward = reward + timeBonus;

      addCoins(totalReward); // Adiciona ao banco
      setRewardMessage(`Você achou tudo em ${time}s! +${totalReward} moedas!`);
    }
  }, [
    foundWords,
    game.words,
    gameState,
    time,
    difficulty,
    addCoins,
    rewardMessage,
  ]);

  // --- Manipuladores de Mouse ---
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

    // Verifica se é uma linha reta ou diagonal válida
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
      setFoundCells((prev) => [...prev, ...selection]);
    }

    setSelection([]);
    selectionWord.current = "";
  };

  // --- Funções de Controle ---
  const startGame = () => {
    setGameState("playing");
    setTime(0);
  };

  const restartGame = (newDifficulty) => {
    const diff = newDifficulty || difficulty;
    setDifficulty(diff);
    setGame(generateGame(diff));
    setFoundWords([]);
    setSelection([]);
    setFoundCells([]);
    setIsSelecting(false);
    setGameState("setup");
    setTime(0);
    setRewardMessage("");
  };

  // Classe CSS da célula
  const getCellClassName = (r, c) => {
    if (foundCells.some((cell) => cell.r === r && cell.c === c)) {
      return "found";
    }
    if (selection.some((cell) => cell.r === r && cell.c === c)) {
      return "selected";
    }
    return "";
  };

  return (
    <div
      className="ws-game-container"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Moedas removidas daqui pois já estão no Header */}

      <h1 className="ws-game-title">Caça-Palavras</h1>

      <div className="ws-main-area">
        <div
          className="ws-grid-wrapper"
          style={{ "--grid-size": gridSizes[difficulty] }}
        >
          {/* ⭐ AQUI ESTÁ A CORREÇÃO ⭐ */}
          <div className="ws-grid notranslate" translate="no">
            {game.grid.map((row, r) =>
              row.map((letter, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`ws-cell ${getCellClassName(r, c)}`}
                  onMouseDown={() => handleMouseDown(r, c)}
                  onMouseEnter={() => handleMouseEnter(r, c)}
                >
                  {letter}
                </div>
              ))
            )}
          </div>

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
