import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import "./TicTacToe.css";
import { useApp } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";

const PLAYER = "X";
const BOT = "O";
const difficultyLevels = ["easy", "medium", "hard", "impossible"];

const REWARDS_CONFIG = {
  easy: { coins: 5, xp: 10 },
  medium: { coins: 15, xp: 30 },
  hard: { coins: 30, xp: 60 },
  impossible: { coins: 100, xp: 200 },
  giveUpPenalty: 15, // Penalidade por desistir
};

const Square = ({ value, onClick }) => {
  const styleClass =
    value === PLAYER
      ? "ttt-square x"
      : value === BOT
        ? "ttt-square o"
        : "ttt-square";
  return (
    <button className={styleClass} onClick={onClick}>
      {value}
    </button>
  );
};

const TicTacToeGame = () => {
  const navigate = useNavigate();
  const { profile, addCoins, isAdmin } = useApp();

  const [board, setBoard] = useState(Array(9).fill(null));
  const [gameMode, setGameMode] = useState("pvc"); // 'pvc' ou 'pvp'
  const [difficulty, setDifficulty] = useState("easy");
  const [unlockedDifficulty, setUnlockedDifficulty] = useState("easy");
  const [xIsNext, setXIsNext] = useState(true);

  const [gameFinished, setGameFinished] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showConfirmGiveUp, setShowConfirmGiveUp] = useState(false);

  // --- LÓGICA DE IA (MINIMAX) ---
  const getEmptySquares = useCallback((squares) => {
    return squares
      .map((sq, i) => (sq === null ? i : null))
      .filter((i) => i !== null);
  }, []);

  const calculateWinner = useCallback((squares) => {
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
    if (squares.every((sq) => sq !== null)) return "draw";
    return null;
  }, []);

  const minimax = useCallback(
    (newBoard, isMaximizing) => {
      const winner = calculateWinner(newBoard);
      if (winner === PLAYER) return -10;
      if (winner === BOT) return 10;
      if (winner === "draw") return 0;

      if (isMaximizing) {
        let bestScore = -Infinity;
        for (const i of getEmptySquares(newBoard)) {
          newBoard[i] = BOT;
          let score = minimax(newBoard, false);
          newBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
        return bestScore;
      } else {
        let bestScore = Infinity;
        for (const i of getEmptySquares(newBoard)) {
          newBoard[i] = PLAYER;
          let score = minimax(newBoard, true);
          newBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
        return bestScore;
      }
    },
    [calculateWinner, getEmptySquares],
  );

  const findBestMove = useCallback(
    (squares) => {
      let bestScore = -Infinity;
      let bestMove = -1;
      for (const i of getEmptySquares(squares)) {
        squares[i] = BOT;
        let score = minimax(squares, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
      return bestMove;
    },
    [minimax, getEmptySquares],
  );

  const findEasyMove = useCallback(
    (squares) => {
      const empty = getEmptySquares(squares);
      return empty.length > 0
        ? empty[Math.floor(Math.random() * empty.length)]
        : -1;
    },
    [getEmptySquares],
  );

  const findMediumMove = useCallback(
    (squares) => {
      return Math.random() > 0.3
        ? findBestMove(squares)
        : findEasyMove(squares);
    },
    [findBestMove, findEasyMove],
  );

  const makeComputerMove = useCallback(() => {
    let move = -1;
    const tempBoard = [...board];
    switch (difficulty) {
      case "easy":
        move = findEasyMove(tempBoard);
        break;
      case "medium":
        move = findMediumMove(tempBoard);
        break;
      case "hard":
        move =
          Math.random() > 0.1
            ? findBestMove(tempBoard)
            : findMediumMove(tempBoard);
        break;
      case "impossible":
        move = findBestMove(tempBoard);
        break;
      default:
        move = findEasyMove(tempBoard);
    }
    if (move !== -1) {
      const newBoard = [...board];
      newBoard[move] = BOT;
      setBoard(newBoard);
      setXIsNext(true); // Devolve a vez para o Player
    }
  }, [board, difficulty, findBestMove, findEasyMove, findMediumMove]);

  // Efeito para turno do Bot
  useEffect(() => {
    const winner = calculateWinner(board);
    // Se não tem vencedor, não é a vez do X (é a vez do O), e o modo é contra o BOT
    if (
      !winner &&
      !xIsNext &&
      gameMode === "pvc" &&
      !gameFinished &&
      !showConfirmGiveUp
    ) {
      const timer = setTimeout(() => makeComputerMove(), 500);
      return () => clearTimeout(timer);
    }
  }, [
    board,
    xIsNext,
    gameMode,
    gameFinished,
    calculateWinner,
    makeComputerMove,
    showConfirmGiveUp,
  ]);

  // Efeito para detectar fim de jogo
  useEffect(() => {
    const winner = calculateWinner(board);
    if (winner && !gameFinished) {
      handleGameEnd(winner);
    }
  }, [board, gameFinished, calculateWinner]);

  // --- FINALIZAÇÃO E RECOMPENSAS ---
  const handleGameEnd = async (result) => {
    setGameFinished(true);

    // 1. Empate
    if (result === "draw") {
      setStatusMessage("Deu Velha! (Empate)");
      return;
    }

    // 2. Vitória da IA
    if (result === BOT && gameMode === "pvc") {
      setStatusMessage("A IA venceu. Tente novamente!");
      return;
    }

    // 3. Vitória do Player no PvC (Ganha prêmios)
    if (result === PLAYER && gameMode === "pvc") {
      const { coins, xp } = REWARDS_CONFIG[difficulty];
      setStatusMessage(`Vitória! +${coins} Moedas | +${xp} XP`);
      if (profile) {
        try {
          const { error } = await supabase.rpc("increment_stats", {
            user_id_input: profile.id,
            coins_add: coins,
            xp_add: xp,
          });
          if (error) throw error;
          addCoins(coins);
          unlockNextLevel();
        } catch (err) {
          console.error(err);
          // Fallback visual
          addCoins(coins);
        }
      }
    }
    // 4. Vitória no PvP (Sem prêmios)
    else {
      const winnerName = result === PLAYER ? "Jogador 1 (X)" : "Jogador 2 (O)";
      setStatusMessage(`${winnerName} Venceu! (PvP sem prêmios)`);
    }
  };

  // --- INTERAÇÃO DO JOGADOR ---
  const handleClick = (i) => {
    // Bloqueia se: já tem vencedor, quadrado tá cheio, ou é a vez do Bot no modo PvC
    if (calculateWinner(board) || board[i] || (!xIsNext && gameMode === "pvc"))
      return;

    const newBoard = [...board];

    // CORREÇÃO AQUI: Se for vez do X, põe X. Se for vez do O (Player 2), põe O.
    newBoard[i] = xIsNext ? PLAYER : BOT;

    setBoard(newBoard);

    // CORREÇÃO AQUI: Inverte o turno corretamente
    setXIsNext(!xIsNext);
  };

  const handleGiveUp = async () => {
    setShowConfirmGiveUp(false);
    setGameFinished(true);

    // Penalidade
    const penalty = REWARDS_CONFIG.giveUpPenalty;
    setStatusMessage(`Você desistiu. -${penalty} Moedas 💸`);

    if (profile) {
      try {
        await supabase.rpc("increment_stats", {
          user_id_input: profile.id,
          coins_add: -penalty,
          xp_add: 0,
        });
        addCoins(-penalty);
      } catch (err) {
        console.error(err);
        addCoins(-penalty);
      }
    }
  };

  const unlockNextLevel = () => {
    const levels = ["easy", "medium", "hard", "impossible"];
    const currentIndex = levels.indexOf(difficulty);
    const unlockedIndex = levels.indexOf(unlockedDifficulty);
    if (currentIndex === unlockedIndex && currentIndex < levels.length - 1) {
      setUnlockedDifficulty(levels[currentIndex + 1]);
    }
  };

  const restartGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setGameFinished(false);
    setStatusMessage("");
    setShowConfirmGiveUp(false);
  };

  const gameStarted = board.some((cell) => cell !== null);

  return (
    <div className="game-container">
      {/* BARRA SUPERIOR */}
      <div className="top-bar">
        <button className="action-text-btn" onClick={() => navigate("/jogos")}>
          ← Voltar
        </button>
        {gameStarted && !gameFinished && (
          <button
            className="action-text-btn give-up-btn"
            onClick={() => setShowConfirmGiveUp(true)}
          >
            🏳️ Desistir
          </button>
        )}
      </div>

      <h1 className="game-title">Jogo da Velha</h1>

      {!gameStarted && (
        <>
          <div className="game-mode-selector">
            <button
              className={gameMode === "pvc" ? "active" : ""}
              onClick={() => {
                setGameMode("pvc");
                restartGame();
              }}
            >
              Contra Bot
            </button>
            <button
              className={gameMode === "pvp" ? "active" : ""}
              onClick={() => {
                setGameMode("pvp");
                restartGame();
              }}
            >
              PvP Local
            </button>
          </div>

          {gameMode === "pvc" && (
            <div className="difficulty-selector">
              {difficultyLevels.map((level) => {
                const isLocked =
                  !isAdmin &&
                  difficultyLevels.indexOf(level) >
                    difficultyLevels.indexOf(unlockedDifficulty);
                return (
                  <button
                    key={level}
                    onClick={() => {
                      setDifficulty(level);
                      restartGame();
                    }}
                    className={difficulty === level ? "active" : ""}
                    disabled={isLocked}
                  >
                    {isLocked ? "🔒 " : ""}
                    {level}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      <div
        className={`game-status ${gameFinished && statusMessage.includes("Vitória") ? "reward-status" : ""}`}
      >
        {/* Mostra mensagem de status OU de quem é a vez */}
        {statusMessage || (xIsNext ? `Vez do X` : `Vez do O`)}
      </div>

      <div className="ttt-board">
        {board.map((val, idx) => (
          <Square key={idx} value={val} onClick={() => handleClick(idx)} />
        ))}
      </div>

      {gameFinished && (
        <button className="restart-button" onClick={restartGame}>
          Jogar Novamente
        </button>
      )}

      {/* MODAL DE CONFIRMAÇÃO */}
      {showConfirmGiveUp && (
        <div className="game-modal">
          <h2>Desistir da Partida?</h2>
          <p>
            Você perderá <strong>{REWARDS_CONFIG.giveUpPenalty} Moedas</strong>.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
              gap: "10px",
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

export default TicTacToeGame;
