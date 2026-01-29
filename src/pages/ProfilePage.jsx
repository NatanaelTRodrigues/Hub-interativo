import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import UserAvatar from "../components/common/UserAvatar";
import { Link } from "react-router-dom";
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

  // Verifica se tem os itens especiais pelo tipo (melhor que ID fixo)
  const hasSpecialItem = (type) => {
    return storeItems.some((i) => i.tipo === type && inventory.includes(i.id));
  };

  if (!profile) return <div className="loading">Carregando...</div>;

  // Título e Tema
  const equippedTitleItem = storeItems.find(
    (item) => item.id === profile.equipped_title_id
  );
  const userTitle = equippedTitleItem ? equippedTitleItem.nome : "Novato";

  const equippedThemeItem = storeItems.find(
    (item) => item.id === profile.equipped_theme_id
  );
  const themeClass =
    equippedThemeItem && equippedThemeItem.classe_css
      ? equippedThemeItem.classe_css
      : "";

  return (
    <div className="profile-page-container">
      <h1 className="profile-page-title">Perfil do Jogador</h1>

      <div className="profile-content-wrapper">
        <div className={`profile-card ${themeClass}`}>
          <div className="profile-header">
            <div className="avatar-container">
              <UserAvatar size="large" />
            </div>
            <div className="profile-names">
              <h2 className="username">
                {profile.username}
                {isAdmin && <span className="admin-badge">🛡️</span>}
              </h2>
              <div className="user-title">{userTitle}</div>
            </div>
          </div>

          <div className="profile-stats-row">
            <div className="stat-box">
              <span className="stat-label">Moedas</span>
              <span className="stat-value coin-text">{profile.moedas} 💰</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Itens</span>
              <span className="stat-value">{inventory.length}</span>
            </div>
          </div>

          <div className="profile-actions">
            <Link to="/inventario" className="action-btn inventory-btn">
              🎒 Inventário
            </Link>
            <Link to="/loja" className="action-btn store-btn">
              🛒 Loja
            </Link>
            <button onClick={logout} className="action-btn logout-btn">
              Sair
            </button>
          </div>
        </div>

        {/* --- ÁREA DE UPLOADS (Aparece se tiver itens especiais) --- */}
        <div
          className="uploads-section profile-card"
          style={{ marginTop: "20px" }}
        >
          <h3>Customização Avançada</h3>

          {/* Upload de Avatar Imagem (ID ou tipo 'special' antigo, ou lógica custom) */}
          {hasSpecialItem("special") && ( // Ajuste conforme seu banco
            <div className="custom-url-input">
              <label>Avatar (Imagem):</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && updateAvatarUrl(e.target.files[0])
                }
              />
            </div>
          )}

          {/* Upload de Cursor */}
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

          {/* Upload de Chapéu */}
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

          {/* Fallback para mostrar inputs se a lógica de tipo falhar mas tiver o item (caso use IDs fixos 13,14,15) */}
          {/* Adicione sua lógica de IDs fixos aqui se preferir */}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
