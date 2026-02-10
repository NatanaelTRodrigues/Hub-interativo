import React from "react";
import { useApp } from "../../contexts/AppContext";
import "./UserAvatar.css";

const UserAvatar = ({ size = "medium" }) => {
  const { profile, storeItems, inventory } = useApp();

  if (!profile) return <div className={`user-avatar-skeleton ${size}`}></div>;

  // 1. Borda
  let avatarBorderClass = "";
  const equippedBorder = storeItems.find(
    (item) => item.id === profile.equipped_border_id
  );
  if (equippedBorder) {
    const borderName = equippedBorder.nome.split(" ")[1].toLowerCase();
    avatarBorderClass = `border-${borderName}`;
  }

  // 2. Lógica do Chapéu (ATUALIZADA)
  const equippedHatItem = storeItems.find(
    (item) => item.id === profile.equipped_hat_id
  );

  let hatUrl = null;
  if (equippedHatItem) {
    // Se for o chapéu especial, usa a URL do upload do usuário
    if (equippedHatItem.tipo === "special-hat") {
      hatUrl = profile.custom_hat_url;
    } else {
      // Se for chapéu normal da loja, usa a URL do item
      hatUrl = equippedHatItem.url_do_item;
    }
  }

  // 3. Imagem do Avatar
  const hasItem = (itemId) => inventory.includes(itemId);

  const renderImage = () => {
    if (hasItem(14) && profile.avatar_gif_url) {
      return <img src={profile.avatar_gif_url} alt="Avatar" />;
    }
    if ((hasItem(13) || profile.avatar_url) && profile.avatar_url) {
      return <img src={profile.avatar_url} alt="Avatar" />;
    }
    return <img src="https://via.placeholder.com/150" alt="Avatar" />;
  };

  return (
    <div className={`user-avatar-container ${size}`}>
      {/* Renderiza o Chapéu se houver URL válida */}
      {hatUrl && <img src={hatUrl} alt="Chapéu" className="avatar-hat-img" />}

      <div className={`user-avatar-circle ${avatarBorderClass}`}>
        {renderImage()}
      </div>
    </div>
  );
};

export default UserAvatar;
