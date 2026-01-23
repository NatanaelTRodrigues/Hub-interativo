import React, { useState, useEffect, useRef } from "react";
import "./MemoryGame.css";
import { useApp } from "../../contexts/AppContext"; // 1. Importar

// ... (Configuração de EMOJI_DECK, DIFFICULTIES, etc. não muda) ...
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
  easy: { pairs: 4, label: "Fácil", reward: 10 },
  medium: { pairs: 6, label: "Média", reward: 20 },
  hard: { pairs: 10, label: "Difícil", reward: 40 },
  impossible: { pairs: 15, label: "Impossível", reward: 80 },
};
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
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
// ... (Fim da Configuração) ...

const MemoryGame = () => {
  const [difficulty, setDifficulty] = useState("easy");
  const [cards, setCards] = useState(generateDeck(DIFFICULTIES.easy.pairs));
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [gameState, setGameState] = useState("playing");

  // 2. Substituir o useState local
  const { userCoins, addCoins, isAdmin } = useApp();
  const [rewardMessage, setRewardMessage] = useState(""); // Nossa "trava"

  // Lógica de virar (Sem mudança)
  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      setMoves((m) => m + 1);
      const [first, second] = flippedCards;
      if (cards[first].emoji === cards[second].emoji) {
        setMatchedCards((prev) => [...prev, cards[first].emoji]);
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.emoji === cards[first].emoji
              ? { ...card, isMatched: true }
              : card
          )
        );
        resetFlippedCards();
      } else {
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

  // Lógica de Vitória (COM A TRAVA)
  useEffect(() => {
    const totalPairs = DIFFICULTIES[difficulty].pairs;
    // ⭐ 3. Adicionar a "trava"
    if (matchedCards.length === totalPairs && rewardMessage === "") {
      setGameState("won");
      const reward = DIFFICULTIES[difficulty].reward;
      // (Você pode adicionar lógica de bônus por 'moves' aqui)
      const totalReward = reward;
      addCoins(totalReward); // Usar addCoins
      setRewardMessage(
        `Você venceu em ${moves} jogadas! +${totalReward} moedas!`
      );
    }
  }, [matchedCards, difficulty, moves, addCoins, rewardMessage]); // Adicionar dependências

  const resetFlippedCards = () => {
    setFlippedCards([]);
    setIsChecking(false);
  };

  const handleCardClick = (index) => {
    const clickedCard = cards[index];
    if (
      isChecking ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      gameState === "won"
    ) {
      return;
    }
    setCards((prevCards) =>
      prevCards.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );
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
    setRewardMessage(""); // Limpa a "trava"
  };

  return (
    <div className="memory-game-container">
      <h1 className="memory-game-title">Jogo da Memória</h1>
      {gameState === "playing" && moves === 0 && (
        <div className="difficulty-selector memory">
          {Object.keys(DIFFICULTIES).map((level) => {
            return (
              <button
                key={level}
                className={difficulty === level ? "active" : ""}
                onClick={() => restartGame(level)}
              >
                {DIFFICULTIES[level].label} ({DIFFICULTIES[level].pairs * 2}{" "}
                cartas)
              </button>
            );
          })}
        </div>
      )}
      <div className="memory-game-stats">
        Tentativas: <strong>{moves}</strong>
      </div>
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
