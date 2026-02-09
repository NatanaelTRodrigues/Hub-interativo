import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import UserAvatar from "../components/common/UserAvatar";
import { Link } from "react-router-dom";
import {
  getCurrentRank,
  getNextRank,
  getProgressPercentage,
} from "../utils/rankingSystem";
import "./ProfilePage.css";

const ProfilePage = () => {
  const {
    profile,
    logout,
    inventory,
    storeItems,
    isAdmin,
    updateAvatarUrl,
    updateAvatarGifUrl,
    updateCustomCursorUrl,
    updateCustomHatUrl,
  } = useApp();

  // Estados locais para animação e dados derivados
  const [rankData, setRankData] = useState(null);

  // Calcula o Rank sempre que o perfil mudar
  useEffect(() => {
    if (profile) {
      const xp = profile.xp_global || 0;
      setRankData({
        current: getCurrentRank(xp),
        next: getNextRank(getCurrentRank(xp)),
        progress: getProgressPercentage(xp),
      });
    }
  }, [profile]);

  // Verifica se tem os itens especiais pelo tipo
  const hasSpecialItem = (type) => {
    return storeItems.some((i) => i.tipo === type && inventory.includes(i.id));
  };

  if (!profile || !rankData)
    return <div className="loading">Carregando perfil...</div>;

  // Lógica de Título e Tema (Mantida do seu código original)
  const equippedTitleItem = storeItems.find(
    (item) => item.id === profile.equipped_title_id,
  );
  const userTitle = equippedTitleItem
    ? equippedTitleItem.nome
    : rankData.current.name; // Usa o Rank se não tiver título equipado

  const equippedThemeItem = storeItems.find(
    (item) => item.id === profile.equipped_theme_id,
  );
  const themeClass =
    equippedThemeItem && equippedThemeItem.classe_css
      ? equippedThemeItem.classe_css
      : "";

  return (
    <div className="profile-page-container">
      <h1 className="profile-page-title">Perfil do Jogador</h1>

      <div className="profile-content-wrapper">
        {/* --- CARTÃO PRINCIPAL DE PERFIL --- */}
        <div
          className={`profile-card ${themeClass}`}
          style={{
            // Se não tiver tema equipado, usa a cor do Rank como borda sutil
            borderColor: !themeClass ? rankData.current.color : undefined,
            boxShadow:
              !themeClass && rankData.current.shadow
                ? rankData.current.shadow
                : undefined,
          }}
        >
          <div className="profile-header">
            <div className="avatar-container">
              {/* O Avatar agora recebe a borda do Rank */}
              <div
                className="rank-border-wrapper"
                style={{ borderColor: rankData.current.color }}
              >
                <UserAvatar size="large" />
              </div>
            </div>

            <div className="profile-names">
              <h2
                className="username"
                style={{
                  color: !themeClass ? rankData.current.color : undefined,
                }}
              >
                {profile.username}
                {isAdmin && (
                  <span className="admin-badge" title="Administrador">
                    🛡️
                  </span>
                )}
              </h2>
              <div className="user-title">{userTitle}</div>
              <div
                className="user-rank-badge"
                style={{ backgroundColor: rankData.current.color }}
              >
                {rankData.current.name}
              </div>
            </div>
          </div>

          <div className="profile-stats-row">
            <div className="stat-box">
              <span className="stat-label">Moedas</span>
              <span className="stat-value coin-text">{profile.moedas} 💰</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">NRubys</span>
              <span className="stat-value ruby-text">
                {profile.nRubys || 0} 💎
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Total XP</span>
              <span className="stat-value xp-text">
                {profile.xp_global || 0}
              </span>
            </div>
          </div>

          {/* --- BARRA DE PROGRESSO DO RANK (NOVO) --- */}
          <div className="rank-progress-section">
            <div className="rank-progress-header">
              <span style={{ color: rankData.current.color }}>
                {rankData.current.name}
              </span>
              <span
                style={{ color: rankData.next ? rankData.next.color : "#fff" }}
              >
                {rankData.next
                  ? `Próximo: ${rankData.next.name}`
                  : "Nível Máximo!"}
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${rankData.progress}%`,
                  background: `linear-gradient(90deg, ${rankData.current.color}, ${rankData.next ? rankData.next.color : rankData.current.color})`,
                }}
              >
                <div className="progress-glow"></div>
              </div>
            </div>
            <p className="xp-missing-text">
              {rankData.next
                ? `Faltam ${rankData.next.minXp - profile.xp_global} XP para subir!`
                : "Você é uma lenda do ArcadeHub!"}
            </p>
          </div>

          <div className="profile-actions">
            <Link to="/inventario" className="action-btn inventory-btn">
              🎒 Inventário
            </Link>
            <Link to="/loja" className="action-btn store-btn">
              🛒 Loja
            </Link>
            <button onClick={logout} className="action-btn logout-btn">
              🚪 Sair
            </button>
          </div>
        </div>

        {/* --- ÁREA DE CUSTOMIZAÇÃO (Mantida do seu código) --- */}
        {(hasSpecialItem("special") ||
          hasSpecialItem("special-cursor") ||
          hasSpecialItem("special-hat")) && (
          <div
            className="uploads-section profile-card"
            style={{ marginTop: "20px" }}
          >
            <h3>🛠️ Customização Avançada</h3>

            {hasSpecialItem("special") && (
              <div className="custom-url-input">
                <label>Avatar (Upload de Imagem):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && updateAvatarUrl(e.target.files[0])
                  }
                />
              </div>
            )}

            {hasSpecialItem("special-cursor") && (
              <div className="custom-url-input">
                <label>Cursor Personalizado:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    updateCustomCursorUrl(e.target.files[0])
                  }
                />
              </div>
            )}

            {hasSpecialItem("special-hat") && (
              <div className="custom-url-input">
                <label>Chapéu Personalizado:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && updateCustomHatUrl(e.target.files[0])
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
