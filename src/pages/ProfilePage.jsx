import React, { useState } from "react";
import { useApp } from "../contexts/AppContext"; // <-- Importa a "chave" do cofre
import "./ProfilePage.css";

// --- Simulação dos Itens da Loja ---
const storeItems = [
  // Bordas
  {
    id: "b1",
    type: "border",
    name: "Borda Chama (Animada)",
    price: 150,
    img: "🔥",
  },
  {
    id: "b2",
    type: "border",
    name: "Borda Raio (Animada)",
    price: 150,
    img: "⚡",
  },
  { id: "b3", type: "border", name: "Borda Galáxia", price: 200, img: "🌌" },

  // Cursores
  { id: "c1", type: "cursor", name: "Cursor de Fogo", price: 50, img: "🔥" },
  { id: "c2", type: "cursor", name: "Cursor de Água", price: 50, img: "💧" },
  { id: "c3", type: "cursor", name: "Cursor de Tornado", price: 50, img: "🌪️" },

  // Avatares
  { id: "a1", type: "avatar", name: "Avatar Robô", price: 75, img: "🤖" },
  { id: "a2", type: "avatar", name: "Avatar Fantasma", price: 75, img: "👻" },
  { id: "a3", type: "avatar", name: "Avatar Alien", price: 75, img: "👽" },

  // Itens Especiais (URL)
  {
    id: "s1",
    type: "special",
    name: "Perfil com URL (Imagem)",
    price: 500,
    img: "🖼️",
  },
  {
    id: "s2",
    type: "special",
    name: "Perfil com URL (Vídeo/GIF)",
    price: 1000,
    img: "🎬",
  },
];

const ProfilePage = () => {
  // Pega o estado e as funções do cofre global
  const { userCoins, inventory, buyItem } = useApp();

  // Estado local para a URL customizada
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [customCursorUrl, setCustomCursorUrl] = useState("");

  // Checa se o usuário já comprou um item
  const hasItem = (itemId) => inventory.some((item) => item.id === itemId);

  return (
    <div className="profile-page-container">
      {/* --- MOSTRADOR DE MOEDAS (GLOBAL) --- */}
      <div className="profile-coin-display">
        Suas Moedas: <strong>{userCoins} 💰</strong>
      </div>

      <h1 className="profile-title">Meu Perfil & Loja</h1>

      <div className="profile-content">
        {/* --- LADO ESQUERDO: PERFIL E INVENTÁRIO --- */}
        <div className="profile-section profile-inventory">
          <h2>Meu Perfil</h2>
          <div className="profile-avatar-preview">
            {/* Se o usuário tiver o item 's1' e uma URL, mostra */}
            {hasItem("s1") && customAvatarUrl ? (
              <img src={customAvatarUrl} alt="Avatar Customizado" />
            ) : (
              <img src="https://via.placeholder.com/150" alt="Avatar Padrão" />
            )}
          </div>

          <h3>Meu Inventário:</h3>
          {inventory.length === 0 ? (
            <p>Você ainda não comprou nenhum item.</p>
          ) : (
            <ul className="inventory-list">
              {inventory.map((item) => (
                <li key={item.id}>
                  {item.img} {item.name}
                </li>
              ))}
            </ul>
          )}

          {/* --- Seção de Customização por URL --- */}
          <h3>Customização Avançada</h3>
          {hasItem("s1") && (
            <div className="custom-url-input">
              <label>URL da Imagem de Perfil:</label>
              <input
                type="text"
                placeholder="https://.../imagem.png"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
              />
            </div>
          )}
          {hasItem("s2") && (
            <div className="custom-url-input">
              <label>URL do GIF/Vídeo de Perfil:</label>
              <input
                type="text"
                placeholder="https://.../video.gif"
                // (Lógica para vídeo seria mais complexa)
              />
            </div>
          )}
        </div>

        {/* --- LADO DIREITO: LOJA --- */}
        <div className="profile-section profile-store">
          <h2>Loja de Recompensas</h2>

          {storeItems.map((item) => (
            <div key={item.id} className="store-item">
              <div className="item-icon">{item.img}</div>
              <div className="item-info">
                <h4>{item.name}</h4>
                <span className="item-price">{item.price} moedas</span>
              </div>

              <button
                className="buy-button"
                onClick={() => buyItem(item)}
                disabled={hasItem(item.id) || userCoins < item.price}
              >
                {hasItem(item.id)
                  ? "Adquirido"
                  : userCoins < item.price
                  ? "Sem Moedas"
                  : "Comprar"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
