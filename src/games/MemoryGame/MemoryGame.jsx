import React, { useState, useEffect, useRef } from "react";
import "./MemoryGame.css"; // Vamos criar este arquivo

// --- Configuração das Dificuldades ---
const EMOJI_DECK = [
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🐔",
  "🐧",
  "🐦",
  "🐤",
  "🦋",
  "🐞",
  "🐠",
  "🐳",
  "🦓",
  "🦒",
];

const DIFFICULTIES = {
  easy: { pairs: 4, label: "Fácil", reward: 10 }, // 8 cartas
  medium: { pairs: 6, label: "Médio", reward: 20 }, // 12 cartas
  hard: { pairs: 10, label: "Difícil", reward: 40 }, // 20 cartas
  impossible: { pairs: 15, label: "Impossível", reward: 80 }, // 30 cartas
};

// Função para embaralhar o deck (Fisher-Yates shuffle)
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Função para gerar o deck
const generateDeck = (pairCount) => {
  const selectedEmojis = EMOJI_DECK.slice(0, pairCount);
  const deck = [...selectedEmojis, ...selectedEmojis];
  const shuffled = shuffleArray(deck);
  return shuffled.map((emoji, index) => ({
    id: index,
    emoji: emoji,
    isFlipped: false,
    isMatched: false,
  }));
};

const MemoryGame = () => {
  // --- Estados do Jogo ---
  const [difficulty, setDifficulty] = useState("easy");
  const [cards, setCards] = useState(generateDeck(DIFFICULTIES.easy.pairs));
  const [flippedCards, setFlippedCards] = useState([]); // Cartas viradas (max 2)
  const [matchedCards, setMatchedCards] = useState([]); // Pares encontrados
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false); // Trava o clique enquanto checa
  const [gameState, setGameState] = useState("playing"); // 'playing', 'won'

  // Simulação de moedas
  const [userCoins, setUserCoins] = useState(100);
  const [rewardMessage, setRewardMessage] = useState("");

  // --- Lógica Principal do Jogo ---

  // Este useEffect "observa" as cartas viradas
  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true); // Trava o tabuleiro
      setMoves((m) => m + 1); // Incrementa o número de tentativas

      const [first, second] = flippedCards;

      // Se for um PAR
      if (cards[first].emoji === cards[second].emoji) {
        setMatchedCards((prev) => [...prev, cards[first].emoji]);

        // Atualiza as cartas para "isMatched = true"
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.emoji === cards[first].emoji
              ? { ...card, isMatched: true }
              : card
          )
        );
        resetFlippedCards();
      }
      // Se NÃO for um par
      else {
        // Espera 1 segundo e vira de volta
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card, index) =>
              index === first || index === second
                ? { ...card, isFlipped: false }
                : card
            )
          );
          resetFlippedCards();
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  // Este useEffect "observa" se o jogo acabou
  useEffect(() => {
    const totalPairs = DIFFICULTIES[difficulty].pairs;
    if (matchedCards.length === totalPairs) {
      setGameState("won");
      const reward = DIFFICULTIES[difficulty].reward;
      setUserCoins((c) => c + reward);
      setRewardMessage(`Você venceu em ${moves} jogadas! +${reward} moedas!`);
    }
  }, [matchedCards, difficulty, moves]);

  const resetFlippedCards = () => {
    setFlippedCards([]);
    setIsChecking(false); // Libera o tabuleiro
  };

  // --- Manipuladores de Evento ---

  const handleCardClick = (index) => {
    const clickedCard = cards[index];

    // Impede o clique se:
    // 1. O jogo estiver travado (chegando)
    // 2. A carta já estiver virada
    // 3. A carta já for um par
    // 4. O jogo já acabou
    if (
      isChecking ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      gameState === "won"
    ) {
      return;
    }

    // Vira a carta
    setCards((prevCards) =>
      prevCards.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );

    // Adiciona ao array de cartas viradas
    setFlippedCards((prev) => [...prev, index]);
  };

  const restartGame = (newDifficulty) => {
    const diff = newDifficulty || difficulty;
    setDifficulty(diff);
    setCards(generateDeck(DIFFICULTIES[diff].pairs));
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setIsChecking(false);
    setGameState("playing");
    setRewardMessage("");
  };

  return (
    <div className="memory-game-container">
      <div className="coin-display">Moedas: {userCoins} 💰</div>

      <h1 className="memory-game-title">Jogo da Memória</h1>

      {/* --- Seletor de Dificuldade (só no início) --- */}
      {gameState === "playing" && moves === 0 && (
        <div className="difficulty-selector memory">
          {Object.keys(DIFFICULTIES).map((level) => (
            <button
              key={level}
              className={difficulty === level ? "active" : ""}
              onClick={() => restartGame(level)}
            >
              {DIFFICULTIES[level].label} ({DIFFICULTIES[level].pairs * 2}{" "}
              cartas)
            </button>
          ))}
        </div>
      )}

      {/* --- Placar (Tentativas) --- */}
      <div className="memory-game-stats">
        Tentativas: <strong>{moves}</strong>
      </div>

      {/* --- Tabuleiro do Jogo --- */}
      {gameState === "playing" && (
        <div className={`memory-board ${difficulty}`}>
          {cards.map((card, index) => (
            <div
              key={index}
              className={`card ${
                card.isFlipped || card.isMatched ? "flipped" : ""
              }`}
              onClick={() => handleCardClick(index)}
            >
              <div className="card-face card-front">{card.emoji}</div>
              <div className="card-face card-back">?</div>
            </div>
          ))}
        </div>
      )}

      {/* --- Tela de Vitória --- */}
      {gameState === "won" && (
        <div className="game-won-overlay">
          <h2>{rewardMessage}</h2>
          <button className="restart-button" onClick={() => restartGame()}>
            Jogar Novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default MemoryGame;
