import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useApp } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import "./TermoGame.css";

// LISTA CORRIGIDA (Apenas 5 letras)
const WORDS = [
  "TERMO",
  "NOBRE",
  "AMIGO",
  "FESTA",
  "JOGAR",
  "TEXTO",
  "PODER",
  "JUSTO",
  "MUNDO",
  "VIVER",
  "IDEIA",
  "RAZAO",
  "SONHO",
  "TEMPO",
  "FORCA",
  "HONRA",
  "SAGAZ",
  "ANEXO",
  "ETNIA",
  "ICONE",
  "SOBRE",
  "LAPIS",
  "CASAL",
  "GERAR",
  "NIVEL",
  "ATRIZ",
  "IDEAL",
  "LOUCO",
  "RITMO",
  "LINDA",
  "MUITO",
  "VIGOR",
  "CHAVE",
  "PLANO",
  "BRISA",
  "CALOR",
  "LETRA",
  "LIVRO",
  "NOITE",
  "PARTE",
  "FLORA",
  "FAUNA",
  "TIGRE",
  "ZEBRA",
  "COBRA",
  "AGUIA",
  "SUJOS",
  "LIMPO",
  "AUDIO",
  "VIDEO",
  "RADIO",
  "LISTA",
  "PORTA",
  "MESA",
  "NAVIO",
  "PEDRA",
  "CASAS",
  "FALAR",
  "ANDAR",
  "COMER",
  "BEBER",
  "OUVIR",
  "SENTI",
  "PRAIA",
  "CAMPO",
  "CIDADE",
  "RISCO",
  "VALOR",
  "CORPO",
  "MENTE",
  "ALMAS",
  "RISOS",
  "CHUVA",
  "VENTO",
  "NEVES",
  "AREIA",
  "FOLHA",
  "GALHO",
  "TRONC",
  "FRUTO",
  "PEIXE",
  "AVIAO",
  "CARRO",
  "TRENO",
  "MOTOR",
  "RODAR",
  "CORDA",
  "PONTE",
  "TELHA",
  "PAREI",
  "ABRIR",
  "FECHAR",
  "UNIAO",
  "PAZES",
  "GUERRA",
  "MEDOS",
  "CULPA",
  "FELIZ",
  "TRIST",
  "BRAVO",
  "CALMO",
  "LENTO",
  "RAPID",
  "CERTO",
  "ERRAR",
];

const TermoGame = () => {
  const navigate = useNavigate();
  const { profile, addCoins, isAdmin } = useApp();

  const REWARDS = {
    daily: { winCoins: 100, winXP: 200, lossCoins: -90, lossXP: 100 },
    infinite: { winCoins: 5, winXP: 5, lossCoins: -5, lossXP: 5 },
    giveUpPenalty: 15,
  };

  const [mode, setMode] = useState("infinite");

  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState(Array(6).fill(""));
  const [currentRow, setCurrentRow] = useState(0);
  const [currentGuessArr, setCurrentGuessArr] = useState(Array(5).fill(""));
  const [selectedCol, setSelectedCol] = useState(0);

  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState("");
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [keyboardStatus, setKeyboardStatus] = useState({});
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [dailyFinished, setDailyFinished] = useState(false);

  useEffect(() => {
    loadGameState(mode);
  }, [mode]);

  useEffect(() => {
    if (!gameOver && !dailyFinished) {
      saveGameState();
    }
  }, [
    guesses,
    currentRow,
    currentGuessArr,
    keyboardStatus,
    gameOver,
    dailyFinished,
  ]);

  const loadGameState = (selectedMode) => {
    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `termo_state_${selectedMode}_${profile?.id || "guest"}`;
    const saved = localStorage.getItem(storageKey);

    if (selectedMode === "daily") {
      const dailyKey = `termo_daily_done_${profile?.id || "guest"}`;
      const lastPlayedDate = localStorage.getItem(dailyKey);

      if (lastPlayedDate === today && !isAdmin) {
        setDailyFinished(true);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.date === today) {
            setSolution(parsed.solution);
            setGuesses(parsed.guesses);
            setGameOver(true);
            setGameResult(parsed.gameResult || "won");
          }
        }
        return;
      } else {
        setDailyFinished(false);
      }
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      if (selectedMode === "daily" && parsed.date !== today) {
        initNewGame(selectedMode, true);
        return;
      }
      setSolution(parsed.solution);
      setGuesses(parsed.guesses);
      setCurrentRow(parsed.currentRow);
      setCurrentGuessArr(parsed.currentGuessArr || Array(5).fill(""));
      setKeyboardStatus(parsed.keyboardStatus);
      setGameOver(parsed.gameOver);
      setGameResult(parsed.gameResult);
      setRewardClaimed(parsed.rewardClaimed);
      setSelectedCol(
        firstEmptyIndex(parsed.currentGuessArr || Array(5).fill("")),
      );
    } else {
      initNewGame(selectedMode, true);
    }
  };

  const saveGameState = () => {
    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `termo_state_${mode}_${profile?.id || "guest"}`;
    const state = {
      date: today,
      solution,
      guesses,
      currentRow,
      currentGuessArr,
      keyboardStatus,
      gameOver,
      gameResult,
      rewardClaimed,
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const initNewGame = (selectedMode, isLoad = false) => {
    // --- CORREÇÃO DE SEGURANÇA ---
    // Filtra para garantir APENAS palavras de 5 letras
    const validWords = WORDS.filter((word) => word.length === 5);

    let newWord = "";
    const today = new Date().toISOString().slice(0, 10);

    if (selectedMode === "daily") {
      let hash = 0;
      for (let i = 0; i < today.length; i++)
        hash = today.charCodeAt(i) + ((hash << 5) - hash);
      const index = Math.abs(hash) % validWords.length;
      newWord = validWords[index];
    } else {
      newWord = validWords[Math.floor(Math.random() * validWords.length)];
    }

    setSolution(newWord);
    setGuesses(Array(6).fill(""));
    setCurrentGuessArr(Array(5).fill(""));
    setCurrentRow(0);
    setKeyboardStatus({});
    setGameOver(false);
    setGameResult("");
    setRewardClaimed(false);
    setSelectedCol(0);

    if (selectedMode === "infinite") setDailyFinished(false);

    if (!isLoad) {
      const storageKey = `termo_state_${selectedMode}_${profile?.id || "guest"}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          date: today,
          solution: newWord,
          guesses: Array(6).fill(""),
          currentRow: 0,
          currentGuessArr: Array(5).fill(""),
          keyboardStatus: {},
          gameOver: false,
          gameResult: "",
          rewardClaimed: false,
        }),
      );
    }
  };

  const firstEmptyIndex = (arr) => {
    const idx = arr.findIndex((c) => c === "");
    return idx === -1 ? 4 : idx;
  };

  useEffect(() => {
    const handleType = (event) => {
      if (gameOver || showConfirmReset || dailyFinished) return;

      const key = event.key.toUpperCase();
      if (key === "ENTER") submitGuess();
      else if (key === "BACKSPACE") handleDelete();
      else if (key === "ARROWLEFT")
        setSelectedCol((prev) => Math.max(0, prev - 1));
      else if (key === "ARROWRIGHT")
        setSelectedCol((prev) => Math.min(4, prev + 1));
      else if (/^[A-Z]$/.test(key)) handleInput(key);
    };
    window.addEventListener("keydown", handleType);
    return () => window.removeEventListener("keydown", handleType);
  }, [
    currentGuessArr,
    gameOver,
    currentRow,
    selectedCol,
    showConfirmReset,
    dailyFinished,
  ]);

  const handleInput = (letter) => {
    const newArr = [...currentGuessArr];
    newArr[selectedCol] = letter;
    setCurrentGuessArr(newArr);
    if (selectedCol < 4) setSelectedCol(selectedCol + 1);
  };

  const handleDelete = () => {
    const newArr = [...currentGuessArr];
    if (newArr[selectedCol] !== "") {
      newArr[selectedCol] = "";
      setCurrentGuessArr(newArr);
    } else if (selectedCol > 0) {
      newArr[selectedCol - 1] = "";
      setCurrentGuessArr(newArr);
      setSelectedCol(selectedCol - 1);
    }
  };

  const handleTileClick = (index) => {
    if (!gameOver && !dailyFinished) setSelectedCol(index);
  };

  const submitGuess = async () => {
    if (currentGuessArr.some((l) => l === "")) return;
    const guessString = currentGuessArr.join("");

    const newGuesses = [...guesses];
    newGuesses[currentRow] = guessString;
    setGuesses(newGuesses);
    updateKeyboard(guessString);

    if (guessString === solution) {
      finishGame("won");
    } else if (currentRow === 5) {
      finishGame("lost");
    } else {
      setCurrentRow((prev) => prev + 1);
      setCurrentGuessArr(Array(5).fill(""));
      setSelectedCol(0);
    }
  };

  const updateKeyboard = (guess) => {
    const newKeys = { ...keyboardStatus };
    guess.split("").forEach((letter, i) => {
      let status = "absent";
      if (solution[i] === letter) status = "correct";
      else if (solution.includes(letter)) status = "present";

      const current = newKeys[letter];
      if (current === "correct") return;
      if (current === "present" && status === "absent") return;
      newKeys[letter] = status;
    });
    setKeyboardStatus(newKeys);
  };

  const finishGame = async (result) => {
    setGameOver(true);
    setGameResult(result);

    if (mode === "daily") {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`termo_daily_done_${profile?.id || "guest"}`, today);
    }

    await applyEconomy(result);
  };

  const handleGiveUp = async () => {
    setShowConfirmReset(false);
    finishGame("giveup");
  };

  const applyEconomy = async (result) => {
    if (rewardClaimed || !profile) return;
    setRewardClaimed(true);

    let coins = 0;
    let xp = 0;

    if (result === "won") {
      coins =
        mode === "daily" ? REWARDS.daily.winCoins : REWARDS.infinite.winCoins;
      xp = mode === "daily" ? REWARDS.daily.winXP : REWARDS.infinite.winXP;
    } else if (result === "lost") {
      coins =
        mode === "daily" ? REWARDS.daily.lossCoins : REWARDS.infinite.lossCoins;
      xp = mode === "daily" ? REWARDS.daily.lossXP : REWARDS.infinite.lossXP;
    } else if (result === "giveup") {
      coins = -REWARDS.giveUpPenalty;
      xp = 0;
    }

    try {
      const { error: rpcError } = await supabase.rpc("increment_stats", {
        user_id_input: profile.id,
        coins_add: coins,
        xp_add: xp,
      });

      if (rpcError) throw rpcError;

      addCoins(coins);
    } catch (err) {
      console.log("Falha no RPC, tentando update manual...", err.message);
      await supabase
        .from("usuarios")
        .update({
          moedas: (parseInt(profile.moedas) || 0) + coins,
          xp_global: (parseInt(profile.xp_global) || 0) + xp,
        })
        .eq("id", profile.id);

      addCoins(coins);
    }

    saveGameState();
  };

  const getTileStatus = (rowIndex, colIndex) => {
    if (rowIndex >= currentRow) return "";

    const guess = guesses[rowIndex];
    if (!guess) return "";

    const letter = guess[colIndex];
    if (!letter) return "";

    if (letter === solution[colIndex]) {
      return "correct";
    }

    if (solution.includes(letter)) {
      const solutionCount = solution.split(letter).length - 1;
      let correctCount = 0;
      for (let i = 0; i < 5; i++) {
        if (guesses[rowIndex][i] === letter && solution[i] === letter) {
          correctCount++;
        }
      }
      let currentOccurrence = 0;
      for (let i = 0; i < colIndex; i++) {
        if (guesses[rowIndex][i] === letter && solution[i] !== letter) {
          currentOccurrence++;
        }
      }

      if (currentOccurrence < solutionCount - correctCount) {
        return "present";
      }
    }

    return "absent";
  };

  return (
    <div className="termo-container">
      <div className="top-bar">
        <button className="action-text-btn" onClick={() => navigate("/jogos")}>
          ← Voltar
        </button>
        {!gameOver && !dailyFinished && (
          <button
            className="action-text-btn give-up-btn"
            onClick={() => setShowConfirmReset(true)}
          >
            🏳️ Desistir
          </button>
        )}
      </div>

      <div className="game-header">
        <h1 className="termo-title">
          TERMO {mode === "daily" ? "DIÁRIO" : "INFINITO"}
        </h1>

        <div className="mode-switch">
          <button
            className={`mode-btn ${mode === "infinite" ? "active" : ""}`}
            onClick={() => setMode("infinite")}
          >
            Infinito
          </button>
          <button
            className={`mode-btn ${mode === "daily" ? "active" : ""}`}
            onClick={() => setMode("daily")}
          >
            Diário {dailyFinished && !isAdmin ? "(🔒)" : "(📅)"}
          </button>
        </div>
      </div>

      {dailyFinished && mode === "daily" && !gameOver ? (
        <div className="daily-locked-message">
          <h2>Você já jogou o Desafio Diário hoje!</h2>
          <p>
            A palavra era:{" "}
            <strong style={{ color: "#538d4e" }}>{solution}</strong>
          </p>
          <p>Volte amanhã para mais XP e Moedas.</p>
          {isAdmin && (
            <button
              className="modal-btn"
              onClick={() => {
                setDailyFinished(false);
                initNewGame("daily", false);
              }}
            >
              Admin Bypass 🛠️
            </button>
          )}
          <button className="modal-btn" onClick={() => setMode("infinite")}>
            Jogar Modo Infinito
          </button>
        </div>
      ) : (
        <>
          <div className="board">
            {guesses.map((guess, rowIndex) => {
              const isCurrent = rowIndex === currentRow;
              return (
                <div key={rowIndex} className="row">
                  {Array(5)
                    .fill(0)
                    .map((_, colIndex) => {
                      let letter = "";
                      let status = "";
                      let isSelected = false;

                      if (rowIndex < currentRow) {
                        letter = guesses[rowIndex][colIndex];
                        status = getTileStatus(rowIndex, colIndex);
                      } else if (isCurrent && !gameOver) {
                        letter = currentGuessArr[colIndex];
                        isSelected = colIndex === selectedCol;
                      }

                      return (
                        <div
                          key={colIndex}
                          className={`tile ${status} ${isSelected ? "selected" : ""} ${isCurrent ? "clickable" : ""} ${letter ? "filled" : ""}`}
                          onClick={() => isCurrent && handleTileClick(colIndex)}
                        >
                          {letter}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>

          <div className="keyboard">
            {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row, i) => (
              <div key={i} className="key-row">
                {i === 2 && (
                  <button className="key big" onClick={submitGuess}>
                    ENTER
                  </button>
                )}
                {row.split("").map((char) => (
                  <button
                    key={char}
                    className={`key ${keyboardStatus[char] || ""}`}
                    onClick={() => handleInput(char)}
                  >
                    {char}
                  </button>
                ))}
                {i === 2 && (
                  <button className="key big" onClick={handleDelete}>
                    ⌫
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showConfirmReset && (
        <div className="game-modal">
          <h2>Desistir?</h2>
          <p>
            Você perderá <strong>{REWARDS.giveUpPenalty} Moedas</strong>.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              className="modal-btn"
              onClick={() => setShowConfirmReset(false)}
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

      {gameOver && (
        <div className="game-modal">
          <h2>
            {gameResult === "won"
              ? "🎉 VITÓRIA!"
              : gameResult === "giveup"
                ? "🏳️ DESISTIU"
                : "💀 DERROTA"}
          </h2>

          <div
            style={{
              margin: "15px 0",
              padding: "15px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
            }}
          >
            <p style={{ fontSize: "1.1rem", marginBottom: "10px" }}>
              Palavra:{" "}
              <strong style={{ color: "#fff", fontSize: "1.4rem" }}>
                {solution}
              </strong>
            </p>

            {gameResult === "won" ? (
              <>
                <p style={{ color: "#ffd700" }}>
                  +
                  {mode === "daily"
                    ? REWARDS.daily.winCoins
                    : REWARDS.infinite.winCoins}{" "}
                  Moedas 💰
                </p>
                <p style={{ color: "#00e676" }}>
                  +
                  {mode === "daily"
                    ? REWARDS.daily.winXP
                    : REWARDS.infinite.winXP}{" "}
                  XP 🆙
                </p>
              </>
            ) : (
              <p style={{ color: "#ff5252" }}>
                {gameResult === "giveup"
                  ? -REWARDS.giveUpPenalty
                  : mode === "daily"
                    ? REWARDS.daily.lossCoins
                    : REWARDS.infinite.lossCoins}{" "}
                Moedas 💸
              </p>
            )}
          </div>

          {mode === "daily" ? (
            <div>
              <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
                Desafio Diário Concluído!
              </p>
              {isAdmin && (
                <button
                  className="modal-btn"
                  onClick={() => setDailyFinished(false)}
                  style={{ marginBottom: "10px", background: "#555" }}
                >
                  Resetar (Admin)
                </button>
              )}
              <button className="modal-btn" onClick={() => setMode("infinite")}>
                Ir para Modo Infinito
              </button>
            </div>
          ) : (
            <button
              className="modal-btn"
              onClick={() => initNewGame("infinite")}
            >
              Jogar Novamente
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TermoGame;
