import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import "./InventoryPage.css";

const InventoryPage = () => {
  const { profile, inventory, storeItems, equipItem } = useApp();
  const [filterType, setFilterType] = useState("all");
  const [showUnowned, setShowUnowned] = useState(false);

  // Debug para ver se os itens estão chegando
  useEffect(() => {
    // console.log("Inventário Debug:", storeItems);
  }, [storeItems]);

  const hasItem = (itemId) => inventory.includes(itemId);

  const isEquipped = (item) => {
    if (!profile) return false;
    if (item.tipo === "borda") return profile.equipped_border_id === item.id;
    if (item.tipo === "cursor" || item.tipo === "special-cursor")
      return profile.equipped_cursor_id === item.id;
    if (item.tipo === "avatar") return profile.avatar_url === item.url_do_item;
    if (item.tipo === "titulo") return profile.equipped_title_id === item.id;
    if (item.tipo === "tema") return profile.equipped_theme_id === item.id;
    // Verifica ambos os tipos de chapéu
    if (item.tipo === "chapeu" || item.tipo === "special-hat")
      return profile.equipped_hat_id === item.id;
    return false;
  };

  const filteredItems = storeItems.filter((item) => {
    const tipoItem = item.tipo ? item.tipo.toLowerCase() : "";

    // Filtros por Categoria
    if (filterType !== "all") {
      if (filterType === "cursor" && tipoItem === "special-cursor") return true;
      if (filterType === "chapeu" && tipoItem === "special-hat") return true;
      if (tipoItem !== filterType) return false;
    }

    // Esconde item padrão do sistema se não tiver
    if (item.url_do_item === "DEFAULT" && !hasItem(item.id)) return false;

    // Filtro "Mostrar o que não tenho"
    if (!showUnowned && !hasItem(item.id)) return false;

    return true;
  });

  return (
    <div className="inventory-page">
      <h1>Meu Inventário</h1>

      <div className="inventory-controls">
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={filterType === "all" ? "active" : ""}
              onClick={() => setFilterType("all")}
            >
              Tudo
            </button>
            <button
              className={filterType === "borda" ? "active" : ""}
              onClick={() => setFilterType("borda")}
            >
              Bordas
            </button>
            <button
              className={filterType === "cursor" ? "active" : ""}
              onClick={() => setFilterType("cursor")}
            >
              Cursores
            </button>
            <button
              className={filterType === "avatar" ? "active" : ""}
              onClick={() => setFilterType("avatar")}
            >
              Avatares
            </button>
            <button
              className={filterType === "titulo" ? "active" : ""}
              onClick={() => setFilterType("titulo")}
            >
              Títulos
            </button>
            <button
              className={filterType === "tema" ? "active" : ""}
              onClick={() => setFilterType("tema")}
            >
              Temas
            </button>
            <button
              className={filterType === "chapeu" ? "active" : ""}
              onClick={() => setFilterType("chapeu")}
            >
              Chapéus
            </button>
          </div>
        </div>

        <label className="toggle-unowned">
          <input
            type="checkbox"
            checked={showUnowned}
            onChange={(e) => setShowUnowned(e.target.checked)}
          />
          <span style={{ marginLeft: "8px" }}>Mostrar o que não tenho</span>
        </label>
      </div>

      <div className="inventory-grid-large">
        {filteredItems.map((item) => {
          const owned = hasItem(item.id);
          const equipped = isEquipped(item);

          return (
            <div
              key={item.id}
              className={`inv-card ${!owned ? "locked" : ""} ${
                equipped ? "equipped" : ""
              }`}
            >
              <div className="inv-icon">
                {item.tipo === "borda" && "🖼️"}
                {item.tipo === "cursor" && "🖱️"}
                {item.tipo === "special-cursor" && "🖱️✨"}
                {item.tipo === "avatar" && "👤"}
                {item.tipo === "titulo" && "🏷️"}
                {item.tipo === "tema" && "🎨"}
                {/* Visualização de Chapéu (Com suporte a IMG) */}
                {(item.tipo === "chapeu" || item.tipo === "special-hat") &&
                  (item.url_do_item ? (
                    <img
                      src={item.url_do_item}
                      alt="Item"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    "🎩"
                  ))}
              </div>

              <h3>{item.nome}</h3>
              <p className="item-type-tag">{item.tipo.toUpperCase()}</p>

              {owned ? (
                <button
                  className={`action-btn ${equipped ? "unequip" : "equip"}`}
                  onClick={() => equipItem(item)}
                >
                  {equipped ? "✖ Desequipar" : "Equipar"}
                </button>
              ) : (
                <button className="action-btn locked" disabled>
                  Bloqueado
                </button>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              color: "#aaa",
              padding: "2rem",
            }}
          >
            <p>Nenhum item encontrado.</p>
            {!showUnowned && (
              <p>Marque "Mostrar o que não tenho" para ver itens da loja.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
