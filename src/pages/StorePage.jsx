import React from "react";
import { useApp } from "../contexts/AppContext";
import "./ProfilePage.css";

const StorePage = () => {
  const { storeItems, userCoins, inventory, buyItem, isAdmin } = useApp();
  const hasItem = (id) => inventory.includes(id);

  // Filtra itens de admin
  const visibleItems = storeItems.filter((item) => {
    if (item.admin_only) return isAdmin;
    return true;
  });

  return (
    <div className="profile-page-container">
      <h1 className="profile-title">Loja de Recompensas</h1>
      {isAdmin && <p style={{ color: "#ff6b6b" }}>Modo Admin Ativo 🔓</p>}

      <div
        className="profile-section profile-store"
        style={{ width: "100%", maxWidth: "1000px" }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={`store-item ${item.admin_only ? "admin-item" : ""}`}
          >
            <div className="item-info">
              <h4>
                {item.nome} {item.admin_only && "(ADM)"}
              </h4>
              <p style={{ fontSize: "0.8rem", color: "#888", margin: 0 }}>
                {item.tipo.toUpperCase()}
              </p>
              <span className="item-price">
                {item.preco === 0 ? "GRÁTIS" : `${item.preco} moedas`}
              </span>
            </div>

            <button
              className="buy-button"
              onClick={() => buyItem(item)}
              disabled={hasItem(item.id) || userCoins < item.preco}
            >
              {hasItem(item.id)
                ? "Adquirido"
                : userCoins < item.preco
                ? "Sem Moedas"
                : "Comprar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorePage;
