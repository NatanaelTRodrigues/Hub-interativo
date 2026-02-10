import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import UserAvatar from "../components/common/UserAvatar"; // Se tiver, ou use img normal
import { getCurrentRank } from "../utils/rankingSystem";
import "./LeaderboardPage.css";

const LeaderboardPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // 1. Pega o ID do usuário atual para destacar na lista
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setMyId(user.id);

      // 2. Busca os Top 50 ordenados por XP
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("xp_global", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLeaders(data);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="loading-screen">Carregando Ranking...</div>;

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">🏆 Ranking Global</h1>
      <p className="leaderboard-subtitle">Os maiores lendas do ArcadeHub</p>

      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Jogador</th>
              <th>Elo</th>
              <th>XP Total</th>
              <th>Vitórias</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((player, index) => {
              const rank = getCurrentRank(player.xp_global || 0);
              const isMe = player.id === myId;

              return (
                <tr key={player.id} className={isMe ? "my-rank-row" : ""}>
                  <td className="rank-pos">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && `#${index + 1}`}
                  </td>

                  <td className="player-cell">
                    {/* Se você não tiver o componente UserAvatar, use img simples */}
                    <div className="player-avatar-small">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="player-info">
                      <span className="player-name">
                        {player.username}
                        {player.is_admin && <span title="Admin">🛡️</span>}
                      </span>
                      {isMe && <span className="me-badge">(Você)</span>}
                    </div>
                  </td>

                  <td>
                    <span
                      className="rank-badge-small"
                      style={{
                        backgroundColor: rank.color,
                        boxShadow: rank.shadow || "none",
                        color: index >= 11 ? "black" : "white", // Cor do texto ajustada para ranks claros
                      }}
                    >
                      {rank.name}
                    </span>
                  </td>

                  <td className="xp-cell">{player.xp_global || 0} XP</td>

                  <td>
                    {/* Campo futuro para vitórias */}
                    {Math.floor((player.xp_global || 0) / 100)} ⚔️
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;
