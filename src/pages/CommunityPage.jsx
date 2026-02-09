import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Ajuste o caminho se necessário
import { useFriendSystem } from "../hooks/useFriendSystem"; // O arquivo que criamos antes

import "./CommunityPage.css";

const CommunityPage = () => {
  const [currentUser, setCurrentUser] = useState(null);

  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
    };
    fetchUser();
  }, []);

  // --- 2. USAR O SISTEMA DE AMIGOS ---
  const { friends, pendingRequests, sendFriendRequest, acceptRequest } =
    useFriendSystem(currentUser);

  // --- ESTADOS VISUAIS ---
  const [showFriends, setShowFriends] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [searchFriendName, setSearchFriendName] = useState(""); // Novo: Busca de amigo

  // --- 3. FUNÇÕES DE ADMIN (REAIS) ---

  // Busca todos os usuários do banco para o Admin ver
  const fetchAllUsersForAdmin = async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("id", { ascending: true }); // Pega todos

    if (data) setAllUsers(data);
  };

  // Ao abrir o painel, carrega os dados reais
  const handleOpenAdmin = () => {
    setShowAdminPanel(true);
    fetchAllUsersForAdmin();
  };

  // Atualiza input localmente (visual)
  const handleLocalCoinChange = (id, newAmount) => {
    setAllUsers(
      allUsers.map((u) =>
        u.id === id ? { ...u, moedas: parseInt(newAmount) || 0 } : u,
      ),
    );
  };

  // SALVAR NO BANCO DE DADOS
  const saveCoinsToDatabase = async () => {
    try {
      // Loop para atualizar cada usuário modificado (simples para Admin)
      for (const user of allUsers) {
        await supabase
          .from("usuarios")
          .update({ moedas: user.moedas })
          .eq("id", user.id);
      }
      alert("Sucesso! Moedas atualizadas no Banco de Dados.");
      setShowAdminPanel(false);
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    }
  };

  return (
    <div className="community-container">
      {/* --- HEADER --- */}
      <header className="community-header">
        <h1>Hub Community</h1>

        <div className="header-actions" style={{ position: "relative" }}>
          {/* Botão Admin */}
          <button className="btn-admin" onClick={handleOpenAdmin}>
            🛠️ Admin
          </button>

          {/* Botão Amigos */}
          <button
            className="btn-friends"
            onClick={() => setShowFriends(!showFriends)}
          >
            👥 Amigos ({friends.length})
            {pendingRequests.length > 0 && (
              <span
                style={{
                  marginLeft: 5,
                  background: "red",
                  borderRadius: "50%",
                  padding: "2px 6px",
                  fontSize: "0.7rem",
                }}
              >
                !
              </span>
            )}
          </button>

          <button className="btn-primary">Novo Post +</button>

          {/* --- MENU DE AMIGOS (Dropdown) --- */}
          {showFriends && (
            <div className="friends-dropdown">
              {/* ÁREA DE ADICIONAR AMIGOS (Destaque) */}
              <div
                style={{
                  padding: "15px",
                  borderBottom: "1px solid #444",
                  backgroundColor: "#252525",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <label style={{ fontSize: "0.8rem", color: "#aaa" }}>
                  Adicionar novo amigo:
                </label>
                <div style={{ display: "flex", gap: "5px" }}>
                  <input
                    type="text"
                    placeholder="Digite o nome exato..."
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #555",
                      backgroundColor: "#1e1e1e",
                      color: "white",
                      outline: "none",
                    }}
                    value={searchFriendName} // Certifique-se de ter esse state criado
                    onChange={(e) => setSearchFriendName(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (!searchFriendName) return alert("Digite um nome!");
                      sendFriendRequest(searchFriendName);
                      setSearchFriendName("");
                    }}
                    style={{
                      backgroundColor: "#28a745",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                      padding: "0 15px",
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </div>

              {/* LISTA DE PEDIDOS PENDENTES */}
              {pendingRequests.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#3a2e00",
                    padding: "10px",
                    borderBottom: "1px solid #554400",
                  }}
                >
                  <small style={{ color: "#ffcc00", fontWeight: "bold" }}>
                    🔔 Solicitações Pendentes:
                  </small>
                  {pendingRequests.map((req) => (
                    <div
                      key={req.requestId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "8px",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "white" }}>
                        {req.from.username}
                      </span>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button
                          onClick={() => acceptRequest(req.requestId)}
                          style={{
                            background: "#28a745",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "3px",
                          }}
                        >
                          ✅
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LISTA DE AMIGOS */}
              <div style={{ padding: "10px" }}>
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    color: "#ddd",
                    fontSize: "0.9rem",
                  }}
                >
                  Seus Amigos ({friends.length})
                </h4>

                <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {friends.length === 0 ? (
                    <p
                      style={{
                        color: "#777",
                        fontSize: "0.8rem",
                        textAlign: "center",
                        padding: "10px",
                      }}
                    >
                      Nenhum amigo ainda. <br /> Use o campo acima para
                      adicionar!
                    </p>
                  ) : (
                    friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="friend-item"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom: "1px solid #333",
                        }}
                      >
                        <span style={{ color: "white" }}>
                          {friend.username}
                        </span>
                        <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
                          {friend.moedas} 🪙
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
              <h2 style={{ margin: 0 }}>Painel Admin (DB Real)</h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                style={{
                  background: "transparent",
                  color: "red",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                }}
              >
                X
              </button>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {allUsers.map((user) => (
                <div key={user.id} className="admin-user-row">
                  <div>
                    <strong>{user.username}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#888" }}>
                      Rank: {user.rank_tier}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>🪙</span>
                    <input
                      type="number"
                      className="coin-input"
                      value={user.moedas} // Campo 'moedas' do Supabase
                      onChange={(e) =>
                        handleLocalCoinChange(user.id, e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-save"
              onClick={saveCoinsToDatabase}
              style={{ marginTop: "20px" }}
            >
              Salvar no Banco de Dados
            </button>
          </div>
        </div>
      )}

      {/* --- CONTEÚDO DA PÁGINA --- */}
      <div style={{ textAlign: "center", marginTop: "50px", color: "#555" }}>
        <h3>Bem-vindo ao Hub</h3>
        <p>Agora o sistema está conectado ao Supabase!</p>
      </div>
    </div>
  );
};

export default CommunityPage;
