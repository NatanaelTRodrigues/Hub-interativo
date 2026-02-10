const RANKS = [
  { name: "Barro", minXp: 0, reward: 100 },
  { name: "Ferro", minXp: 1000, reward: 200 },
  { name: "Bronze", minXp: 2500, reward: 350 },
  { name: "Prata", minXp: 4500, reward: 500 },
  { name: "Ouro", minXp: 7000, reward: 800 },
  { name: "Platina", minXp: 10000, reward: 1200 }, // + Borda Platina
  { name: "Rubi", minXp: 15000, reward: 2000 },
  { name: "Jadeita", minXp: 22000, reward: 3000 }, // + 50 NRubys
  { name: "Garnet", minXp: 32000, reward: 4500 },
  { name: "Tanzanita", minXp: 45000, reward: 6000 },
  { name: "Poudretteite", minXp: 60000, reward: 8000 }, // + 200 NRubys
  { name: "HighChallenger", minXp: 100000, reward: 15000 },
];

function addExperience(user, amount) {
  user.xp_global += amount;

  const newRank = RANKS.reverse().find((rank) => user.xp_global >= rank.minXp);

  if (newRank.name !== user.rank_tier) {
    user.rank_tier = newRank.name;
    user.coins += newRank.reward;

    alert(`Parabéns! Você subiu para o elo ${newRank.name}!`);
  }

  return user;
}
