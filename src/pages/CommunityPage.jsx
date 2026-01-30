import React, { useState } from "react";
import "./CommunityPage.css";

const CommunityPage = () => {
  // --- ESTADOS ---
  const [showFriends, setShowFriends] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Dados simulados de usuários (com moedas)
  const [users, setUsers] = useState([
    { id: 1, name: "Gabriel", coins: 150, online: true },
    { id: 2, name: "Freud", coins: 300, online: true },
    { id: 3, name: "Ana Souza", coins: 50, online: false },
    { id: 4, name: "Natanael (Você)", coins: 1000, online: true }, // Simulando você
  ]);

  // --- FUNÇÕES DE ADMIN ---

  // Função para atualizar o input de moedas temporariamente
  const handleCoinChange = (id, newAmount) => {
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, coins: parseInt(newAmount) || 0 } : user
      )
    );
  };

  return (
    <div className="community-container">
      {/* --- HEADER --- */}
      <header className="community-header">
        <h1>Hub Community</h1>

        <div className="header-actions">
          {/* Botão Admin */}
          <button className="btn-admin" onClick={() => setShowAdminPanel(true)}>
            🛠️ Admin
          </button>

          {/* Botão Amigos */}
          <button
            className="btn-friends"
            onClick={() => setShowFriends(!showFriends)}
          >
            👥 Amigos ({users.filter((u) => u.id !== 4).length})
          </button>

          <button className="btn-primary">Novo Post +</button>

          {/* --- MENU DE AMIGOS (Dropdown) --- */}
          {showFriends && (
            <div className="friends-dropdown">
              <h4
                style={{
                  marginTop: 0,
                  borderBottom: "1px solid #444",
                  paddingBottom: "5px",
                }}
              >
                Seus Amigos
              </h4>
              {users
                .filter((u) => u.id !== 4)
                .map((friend) => (
                  <div key={friend.id} className="friend-item">
                    <span>{friend.name}</span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
                        {friend.coins} 🪙
                      </span>
                      {friend.online && (
                        <div className="online-dot" title="Online"></div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </header>

      {/* --- MODAL DO ADMIN (Edição de Moedas) --- */}
      {showAdminPanel && (
        <div className="admin-modal-overlay">
          <div className="admin-panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0 }}>Painel de Moedas</h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                style={{ background: "transparent", color: "red" }}
              >
                X
              </button>
            </div>

            {users.map((user) => (
              <div key={user.id} className="admin-user-row">
                <div>
                  <strong>{user.name}</strong>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>
                    ID: {user.id}
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span>🪙</span>
                  <input
                    type="number"
                    className="coin-input"
                    value={user.coins}
                    onChange={(e) => handleCoinChange(user.id, e.target.value)}
                  />
                </div>
              </div>
            ))}

            <button
              className="btn-save"
              onClick={() => {
                alert("Moedas atualizadas com sucesso!");
                setShowAdminPanel(false);
              }}
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {/* --- CONTEÚDO DA PÁGINA (Feed) --- */}
      <div style={{ textAlign: "center", marginTop: "50px", color: "#555" }}>
        <h3>Bem-vindo ao Hub</h3>
        <p>
          Selecione "Admin" para editar moedas ou "Amigos" para ver a lista.
        </p>
      </div>
    </div>
  );
};

export default CommunityPage;
