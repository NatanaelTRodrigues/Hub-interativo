import React, { useState, useEffect, useCallback } from "react";
import "./TicTacToe.css";
import { useApp } from "../../contexts/AppContext"; // Importação correta

// --- Constantes do Jogo (Sem mudança) ---
const PLAYER = "X";
const BOT = "O";
const difficultyLevels = ["easy", "medium", "hard", "impossible"];
const REWARDS = {
  easy: 5,
  medium: 10,
  hard: 20,
  impossible: 50,
};

// Componente Square (Sem mudança)
const Square = ({ value, onClick }) => (
  <button className="square" onClick={onClick}>
    {value}
  </button>
);

// Componente principal do jogo
const TicTacToeGame = () => {
  // --- Estados do Jogo ---
  const [board, setBoard] = useState(Array(9).fill(null));
  const [gameMode, setGameMode] = useState("pvp");
  const [difficulty, setDifficulty] = useState("easy");
  const [unlockedDifficulty, setUnlockedDifficulty] = useState("easy");
  const [xIsNext, setXIsNext] = useState(true);
  const [rewardMessage, setRewardMessage] = useState("");

  // --- ⭐⭐⭐ A CORREÇÃO ESTÁ AQUI ⭐⭐⭐ ---
  // 1. REMOVA a linha: const [userCoins, setUserCoins] = useState();
  // 2. ADICIONE estas linhas para pegar o cofre GLOBAL:
  const { userCoins, addCoins } = useApp();
  // --- Fim da Correção ---

  // --- Funções de Lógica (Sem mudança) ---
  const getEmptySquares = useCallback((squares) => {
    return squares
      .map((sq, i) => (sq === null ? i : null))
      .filter((i) => i !== null);
  }, []);

  const calculateWinner = useCallback(
    (squares) => {
      const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];
      for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (
          squares[a] &&
          squares[a] === squares[b] &&
          squares[a] === squares[c]
        ) {
          return squares[a];
        }
      }
      if (getEmptySquares(squares).length === 0) return "draw";
      return null;
    },
    [getEmptySquares]
  );

  // --- Lógica da IA (Sem mudança) ---
  const minimax = useCallback(
    (newBoard, isMaximizing) => {
      // (Todo o código do minimax... sem mudança)
      const winner = calculateWinner(newBoard);
      if (winner === PLAYER) return 10;
      if (winner === BOT) return -10;
      if (winner === "draw") return 0;

      if (isMaximizing) {
        let bestScore = -Infinity;
        for (const i of getEmptySquares(newBoard)) {
          newBoard[i] = PLAYER;
          let score = minimax(newBoard, false);
          newBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
        return bestScore;
      } else {
        let bestScore = Infinity;
        for (const i of getEmptySquares(newBoard)) {
          newBoard[i] = BOT;
          let score = minimax(newBoard, true);
          newBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
        return bestScore;
      }
    },
    [calculateWinner, getEmptySquares]
  );

  const findEasyMove = useCallback(
    (squares) => {
      // (Sem mudança)
      const emptySquares = getEmptySquares(squares);
      if (emptySquares.length === 0) return -1;
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    },
    [getEmptySquares]
  );

  const findMediumMove = useCallback(
    (squares) => {
      // (Sem mudança)
      const emptySquares = getEmptySquares(squares);
      for (const i of emptySquares) {
        squares[i] = BOT;
        if (calculateWinner(squares) === BOT) {
          squares[i] = null;
          return i;
        }
        squares[i] = null;
      }
      for (const i of emptySquares) {
        squares[i] = PLAYER;
        if (calculateWinner(squares) === PLAYER) {
          squares[i] = null;
          return i;
        }
        squares[i] = null;
      }
      return findEasyMove(squares);
    },
    [getEmptySquares, calculateWinner, findEasyMove]
  );

  const findBestMove = useCallback(
    (squares) => {
      // (Sem mudança)
      let bestScore = Infinity;
      let bestMove = -1;
      for (const i of getEmptySquares(squares)) {
        squares[i] = BOT;
        let score = minimax(squares, true);
        squares[i] = null;
        if (score < bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
      return bestMove;
    },
    [minimax, getEmptySquares]
  );

  const makeComputerMove = useCallback(
    (currentBoard) => {
      // (Sem mudança)
      let move;
      const simulationBoard = [...currentBoard];
      switch (difficulty) {
        case "easy":
          move = findEasyMove(simulationBoard);
          break;
        case "medium":
          move = findMediumMove(simulationBoard);
          break;
        case "hard":
          move =
            Math.random() > 0.5
              ? findBestMove(simulationBoard)
              : findMediumMove(simulationBoard);
          break;
        case "impossible":
          move = findBestMove(simulationBoard);
          break;
        default:
          move = findEasyMove(simulationBoard);
      }
      if (move !== -1) {
        const newBoard = [...currentBoard];
        newBoard[move] = BOT;
        setBoard(newBoard);
        setXIsNext(true);
      }
    },
    [difficulty, findEasyMove, findMediumMove, findBestMove]
  );

  // --- Hooks de Efeito (Sem mudança, mas agora 'addCoins' existe) ---
  useEffect(() => {
    const winner = calculateWinner(board);
    const isComputerTurn = gameMode === "pvc" && !xIsNext && !winner;
    if (isComputerTurn) {
      setTimeout(() => {
        makeComputerMove(board);
      }, 500);
    }
  }, [board, xIsNext, gameMode, calculateWinner, makeComputerMove]);

  useEffect(() => {
    const winner = calculateWinner(board);
    if (!winner || winner === "draw") return;

    if (winner === PLAYER && gameMode === "pvc") {
      const reward = REWARDS[difficulty];
      addCoins(reward); // Agora esta função é válida!
      setRewardMessage(`Você venceu! +${reward} moedas!`);

      const currentLevelIndex = difficultyLevels.indexOf(difficulty);
      const unlockedLevelIndex = difficultyLevels.indexOf(unlockedDifficulty);

      if (
        currentLevelIndex === unlockedLevelIndex &&
        currentLevelIndex < difficultyLevels.length - 1
      ) {
        const nextDifficulty = difficultyLevels[currentLevelIndex + 1];
        setUnlockedDifficulty(nextDifficulty);
        setRewardMessage((msg) => msg + ` Nível "${nextDifficulty}" liberado!`);
      }
    } else if (winner === BOT && gameMode === "pvc") {
      setRewardMessage("O Bot venceu. Tente novamente!");
    }
  }, [
    board,
    gameMode,
    difficulty,
    unlockedDifficulty,
    calculateWinner,
    addCoins, // A dependência está correta
  ]);

  useEffect(() => {
    const winner = calculateWinner(board);
    if (winner === "draw") {
      setRewardMessage("Deu Velha! (Empate)");
    }
  }, [board, calculateWinner]);

  // --- Manipuladores de Evento (Sem mudança) ---
  const handleClick = (i) => {
    // (Sem mudança)
    const winner = calculateWinner(board);
    const isComputerTurn = gameMode === "pvc" && !xIsNext;
    if (winner || board[i] || isComputerTurn) {
      return;
    }
    const newBoard = [...board];
    newBoard[i] = xIsNext ? PLAYER : BOT;
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const restartGame = () => {
    // (Sem mudança)
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setRewardMessage("");
  };

  const selectGameMode = (mode) => {
    // (Sem mudança)
    setGameMode(mode);
    restartGame();
  };

  const selectDifficulty = (diff) => {
    // (Sem mudança)
    setDifficulty(diff);
    restartGame();
  };

  // --- Lógica de Renderização (Sem mudança) ---
  const winner = calculateWinner(board);
  const gameStarted = board.some((sq) => sq !== null);
  let status;
  if (!winner) {
    status = `Próximo jogador: ${xIsNext ? PLAYER : BOT}`;
  } else if (winner === "draw") {
    status = "Deu Velha! (Empate)";
  } else {
    status = `Vencedor: ${winner}`;
  }
  const statusClassName = `game-status ${
    rewardMessage ? "reward-status" : "normal-status"
  }`;

  // O 'return (...)' é o JSX e não muda.
  // O <div className="coin-display">Moedas: {userCoins} 💰</div>
  // agora vai ler 'userCoins' do cofre global automaticamente.
  return (
    <div className="game-container">
      <div className="coin-display">Moedas: {userCoins} 💰</div>

      <h1 className="game-title">Jogo da Velha</h1>

      {!gameStarted ? (
        <>
          <div className="game-mode-selector">
            <button
              onClick={() => selectGameMode("pvp")}
              className={gameMode === "pvp" ? "active" : ""}
            >
              Jogador vs Jogador
            </button>
            <button
              onClick={() => selectGameMode("pvc")}
              className={gameMode === "pvc" ? "active" : ""}
            >
              Jogador vs Bot
            </button>
          </div>

          {gameMode === "pvc" && (
            <div className="difficulty-selector">
              {difficultyLevels.map((level) => {
                const levelIndex = difficultyLevels.indexOf(level);
                const unlockedIndex =
                  difficultyLevels.indexOf(unlockedDifficulty);
                const isLocked = levelIndex > unlockedIndex;

                return (
                  <button
                    key={level}
                    onClick={() => selectDifficulty(level)}
                    className={difficulty === level ? "active" : ""}
                    disabled={isLocked}
                    title={
                      isLocked
                        ? `Vença o nível "${
                            difficultyLevels[levelIndex - 1]
                          }" para liberar`
                        : `Nível ${level}`
                    }
                  >
                    {isLocked ? "🔒" : ""} {level}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="game-mode-display">
          Modo: {gameMode === "pvp" ? "PvP" : `PvBot (${difficulty})`}
        </div>
      )}

      <div className={statusClassName}>{rewardMessage || status}</div>

      <div className="board">
        {board.map((value, index) => (
          <Square
            key={index}
            value={value}
            onClick={() => handleClick(index)}
          />
        ))}
      </div>

      {winner && (
        <button className="restart-button" onClick={restartGame}>
          Jogar Novamente
        </button>
      )}
    </div>
  );
};

export default TicTacToeGame;
