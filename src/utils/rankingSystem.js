// src/utils/rankingSystem.js

export const RANKS = [
  { id: 1, name: "Barro", minXp: 0, color: "#795548", border: "none" },
  {
    id: 2,
    name: "Ferro",
    minXp: 1000,
    color: "#9e9e9e",
    border: "2px solid #555",
  },
  {
    id: 3,
    name: "Bronze",
    minXp: 2500,
    color: "#cd7f32",
    border: "2px solid #8d6e63",
  },
  {
    id: 4,
    name: "Prata",
    minXp: 4500,
    color: "#cfd8dc",
    border: "2px solid #b0bec5",
  },
  {
    id: 5,
    name: "Ouro",
    minXp: 7000,
    color: "#ffd700",
    border: "2px solid #ffecb3",
    shadow: "0 0 10px gold",
  },
  {
    id: 6,
    name: "Platina",
    minXp: 10500,
    color: "#00bcd4",
    border: "2px solid #80deea",
    shadow: "0 0 10px cyan",
  },
  {
    id: 7,
    name: "Rubi",
    minXp: 15000,
    color: "#e91e63",
    border: "2px solid #f48fb1",
    shadow: "0 0 15px #e91e63",
  },
  {
    id: 8,
    name: "Jadeita",
    minXp: 21000,
    color: "#009688",
    border: "2px solid #80cbc4",
    shadow: "0 0 15px #009688",
  },
  {
    id: 9,
    name: "Garnet",
    minXp: 28000,
    color: "#8e24aa",
    border: "2px solid #ce93d8",
    shadow: "0 0 20px #8e24aa",
  },
  {
    id: 10,
    name: "Tanzanita",
    minXp: 37000,
    color: "#3f51b5",
    border: "2px solid #9fa8da",
    shadow: "0 0 20px #3f51b5",
  },
  {
    id: 11,
    name: "Poudretteite",
    minXp: 50000,
    color: "#f8bbd0",
    border: "2px solid #ff80ab",
    shadow: "0 0 25px #ff4081",
  },
  {
    id: 12,
    name: "HighChallenger",
    minXp: 75000,
    color: "#ffffff",
    border: "3px solid white",
    shadow: "0 0 40px white",
  },
];

export const getCurrentRank = (xp) => {
  return [...RANKS].reverse().find((rank) => xp >= rank.minXp) || RANKS[0];
};

// Retorna o próximo Rank (para saber a meta)
export const getNextRank = (currentRank) => {
  const index = RANKS.findIndex((r) => r.id === currentRank.id);
  if (index >= RANKS.length - 1) return null;
  return RANKS[index + 1];
};

export const getProgressPercentage = (xp) => {
  const current = getCurrentRank(xp);
  const next = getNextRank(current);

  if (!next) return 100;

  const xpNeeded = next.minXp - current.minXp;
  const xpHave = xp - current.minXp;

  return Math.min(100, Math.max(0, (xpHave / xpNeeded) * 100));
};
