import React, { useState, useRef } from "react";
import { useApp } from "../../contexts/AppContext";
import { Link, useNavigate } from "react-router-dom";
import UserAvatar from "../common/UserAvatar";
import { useFriendSystem } from "../../hooks/useFriendSystem";
import { supabase } from "../../supabaseClient";
import "./Header.css";

const Header = () => {
  const { profile, session, userCoins, logout, isAdmin } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  const {
    friends,
    pendingRequests,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
  } = useFriendSystem(user);
  const [showFriendInput, setShowFriendInput] = React.useState(false);
  const [friendSearch, setFriendSearch] = React.useState("");

  // Clique Secreto
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const handleLogoClick = (e) => {
    const now = new Date().getTime();
    if (now - lastClickTimeRef.current < 500) clickCountRef.current += 1;
    else clickCountRef.current = 1;

    lastClickTimeRef.current = now;

    if (clickCountRef.current >= 3) {
      e.preventDefault();
      clickCountRef.current = 0;
      if (isAdmin) navigate("/admin");
      else alert("Acesso negado.");
    }
  };

  React.useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo" onClick={handleLogoClick}>
          <Link to="/">ArcadeHub</Link>
        </div>

        <nav className="navbar">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/jogos" className="nav-link">
            Jogos
          </Link>
          <Link to="/loja" className="nav-link store-highlight">
            Loja
          </Link>

          {session ? (
            <div className="user-area">
              <div className="coin-badge">
                <span className="coin-value">{userCoins}</span>
                <span className="coin-icon">💰</span>
              </div>

              <div
                className="user-menu-wrapper"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div className="user-info">
                  <span className="username">
                    {profile ? profile.username : "..."}
                  </span>
                  <UserAvatar size="small" />
                  <span className="arrow">▼</span>
                </div>

                {/* --- MENU DROPDOWN (ABRE AO CLICAR) --- */}
                {isMenuOpen && (
                  <div
                    className="dropdown-menu"
                    onMouseLeave={() => setIsMenuOpen(false)}
                    style={{ width: "300px" }}
                  >
                    <div className="dropdown-header">Menu do Jogador</div>
                    <Link to="/perfil" className="menu-item">
                      👤 Meu Perfil
                    </Link>
                    <Link to="/inventario" className="menu-item">
                      🎒 Inventário
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="menu-item"
                        style={{ color: "#ff6b6b" }}
                      >
                        🛠️ Admin Painel
                      </Link>
                    )}

                    <div className="dropdown-divider"></div>

                    {/* --- ÁREA DE SOCIAL (AMIGOS) --- */}
                    <div
                      className="social-section"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 1. SEÇÃO DE PEDIDOS PENDENTES (NOVO E ESTILIZADO) */}
                      {pendingRequests.length > 0 && (
                        <div className="requests-section">
                          <div className="requests-title">
                            🔔 Solicitações ({pendingRequests.length})
                          </div>

                          {pendingRequests.map((req) => (
                            <div key={req.requestId} className="request-card">
                              <div className="requester-info">
                                <div className="requester-avatar">
                                  {req.from.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="requester-name">
                                  {req.from.username}
                                </span>
                              </div>

                              <div className="request-actions">
                                <button
                                  className="btn-action btn-accept"
                                  onClick={() => acceptRequest(req.requestId)}
                                  title="Aceitar"
                                >
                                  ✔
                                </button>
                                <button
                                  className="btn-action btn-reject"
                                  onClick={() => rejectRequest(req.requestId)}
                                  title="Recusar"
                                >
                                  ✖
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 2. BARRA DE TÍTULO E ADICIONAR */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                          padding: "0 10px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            color: "#aaa",
                            fontSize: "0.85rem",
                          }}
                        >
                          AMIGOS ONLINE ({friends.length})
                        </h4>
                        <button
                          onClick={() => setShowFriendInput(!showFriendInput)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#00e676",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                            fontWeight: "bold",
                          }}
                          title="Adicionar Amigo"
                        >
                          +
                        </button>
                      </div>

                      {/* 3. INPUT DE ADICIONAR (Animação suave) */}
                      {showFriendInput && (
                        <div
                          style={{
                            padding: "0 10px 10px 10px",
                            display: "flex",
                            gap: "5px",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Nome do usuário..."
                            value={friendSearch}
                            onChange={(e) => setFriendSearch(e.target.value)}
                            style={{
                              flex: 1,
                              padding: "6px",
                              borderRadius: "4px",
                              border: "1px solid #444",
                              background: "#222",
                              color: "white",
                              fontSize: "0.9rem",
                            }}
                          />
                          <button
                            onClick={() => {
                              sendFriendRequest(friendSearch);
                              setFriendSearch("");
                            }}
                            style={{
                              background: "#00e676",
                              border: "none",
                              borderRadius: "4px",
                              color: "#000",
                              fontWeight: "bold",
                              padding: "0 12px",
                              cursor: "pointer",
                            }}
                          >
                            OK
                          </button>
                        </div>
                      )}

                      {/* 4. LISTA DE AMIGOS */}
                      <div
                        style={{
                          maxHeight: "180px",
                          overflowY: "auto",
                          padding: "0 10px",
                        }}
                      >
                        {friends.length === 0 ? (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "15px",
                              color: "#666",
                              fontSize: "0.8rem",
                              fontStyle: "italic",
                            }}
                          >
                            Nenhum amigo online agora.
                          </div>
                        ) : (
                          friends.map((f) => (
                            <div
                              key={f.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px 0",
                                borderBottom: "1px solid #333",
                              }}
                            >
                              <div style={{ position: "relative" }}>
                                <div
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "50%",
                                    background: "#444",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                  }}
                                >
                                  {f.username.charAt(0).toUpperCase()}
                                </div>
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: "#00e676",
                                    position: "absolute",
                                    bottom: 0,
                                    right: 0,
                                    border: "1px solid #1e1e1e",
                                  }}
                                ></div>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <span
                                  style={{ fontSize: "0.9rem", color: "white" }}
                                >
                                  {f.username}
                                </span>
                                <span
                                  style={{ fontSize: "0.7rem", color: "#aaa" }}
                                >
                                  {f.rank_tier || "Novato"}
                                </span>
                              </div>

                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#ffd700",
                                  marginLeft: "auto",
                                  background: "rgba(255, 215, 0, 0.1)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {f.moedas}¢
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>
                    <button
                      onClick={logout}
                      className="logout-item"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 15px",
                        background: "none",
                        border: "none",
                        color: "#ff5252",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.9rem",
                      }}
                    >
                      🚪 Sair da Conta
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
