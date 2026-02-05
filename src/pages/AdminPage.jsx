import React, { useState } from "react";
import { useApp } from "../contexts/AppContext";
import "./ProfilePage.css"; // Reusa estilos

const AdminPage = () => {
  const { isAdmin, adminAddCoins, profile } = useApp();
  const [coinsInput, setCoinsInput] = useState(10000);

  if (!isAdmin) {
    return (
      <div className="profile-page-container">
        <h1>Acesso Negado 🚫</h1>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <h1 className="profile-title" style={{ color: "#ff6b6b" }}>
        PAINEL DE ADM 🛠️
      </h1>

      <div className="profile-content" style={{ flexDirection: "column" }}>
        <div className="profile-section">
          <h2>Gerenciar Moedas</h2>
          <p>
            Definir saldo atual de: <strong>{profile.username}</strong>
          </p>
          <div
            className="custom-url-input"
            style={{ display: "flex", gap: "10px" }}
          >
            <input
              type="number"
              value={coinsInput}
              onChange={(e) => setCoinsInput(Number(e.target.value))}
            />
            <button
              className="equip-button"
              onClick={() => adminAddCoins(coinsInput)}
            >
              Definir Moedas
            </button>
          </div>
        </div>

        <div className="profile-section" style={{ marginTop: "20px" }}>
          <h2>Status do God Mode</h2>
          <p>
            ✅ Itens Exclusivos: <strong>Visíveis na Loja</strong>
          </p>
          <p>
            ✅ Níveis dos Jogos: <strong>Todos Desbloqueados</strong>
          </p>
          <p>
            ✅ Inventário: <strong>Acesso Irrestrito</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
