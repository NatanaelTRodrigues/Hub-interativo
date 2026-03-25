import React from "react";
import { useApp } from "../contexts/AppContext";
import "./StorePage.css"; 

const StorePage = () => {
  const { storeItems, userCoins, userRubys, inventory, buyItem, isAdmin } = useApp();
  
  const hasItem = (id) => inventory.includes(id);

  // 1. Filtra itens de admin
  const visibleItems = storeItems.filter((item) => {
    if (item.admin_only) return isAdmin;
    return true;
  });

  // 2. Agrupa os itens por Tipo (Categoria)
  const groupedItems = visibleItems.reduce((grupos, item) => {
    // Garante que o tipo fique em letras minúsculas para não duplicar grupos (ex: Borda e borda)
    const tipoFormatado = item.tipo.toLowerCase(); 
    if (!grupos[tipoFormatado]) {
      grupos[tipoFormatado] = [];
    }
    grupos[tipoFormatado].push(item);
    return grupos;
  }, {});

  // Dicionário para deixar os títulos das seções mais bonitos
  const getCategoryTitleAndIcon = (tipo) => {
    switch (tipo) {
      case 'borda': return { title: 'Bordas de Avatar', icon: '🖼️' };
      case 'titulo': return { title: 'Títulos de Perfil', icon: '🏷️' };
      case 'chapeu': return { title: 'Chapéus e Acessórios', icon: '🎩' };
      case 'special-hat': return { title: 'Chapéus Especiais', icon: '👑' };
      case 'cursor': return { title: 'Cursores de Mouse', icon: '🖱️' };
      case 'special-cursor': return { title: 'Cursores Especiais', icon: '✨' };
      case 'avatar': return { title: 'Avatares de Perfil', icon: '👤' };
      case 'tema': return { title: 'Temas de Fundo', icon: '🎨' };
      default: return { title: `Itens de ${tipo}`, icon: '📦' };
    }
  };

  return (
    <div className="store-container">
      
      {/* CABEÇALHO DA LOJA */}
      <header className="store-header">
        <h1 className="store-title">Loja de Recompensas</h1>
        <p className="store-subtitle">Personalize seu perfil com itens exclusivos!</p>
        
        {isAdmin && <div className="admin-badge">Modo Admin Ativo 🔓</div>}

        <div className="store-balances">
          <div className="balance-pill coin">
            {userCoins} 💰
          </div>
          <div className="balance-pill ruby">
            {userRubys} 💎
          </div>
        </div>
      </header>

      {/* ITERA SOBRE AS CATEGORIAS AGRUPADAS */}
      {Object.keys(groupedItems).map((categoryKey) => {
        const categoryData = getCategoryTitleAndIcon(categoryKey);
        const itemsInCategory = groupedItems[categoryKey];

        return (
          <div key={categoryKey} className="store-category-section">
            
            {/* Título da Seção */}
            <h2 className="category-title">
              {categoryData.icon} {categoryData.title}
            </h2>

            {/* Grid dos itens daquela categoria */}
            <div className="store-grid">
              {itemsInCategory.map((item) => {
                const isOwned = hasItem(item.id);
                const isFree = item.preco === 0;
                
                // Conversão: 10 moedas = 1 nRuby
                const rubyPrice = Math.max(1, Math.floor(item.preco / 10));
                
                const canBuyWithCoins = userCoins >= item.preco;
                const canBuyWithRubys = userRubys >= rubyPrice;

                return (
                  <div
                    key={item.id}
                    className={`store-card ${item.admin_only ? "admin-item" : ""} ${isOwned ? "owned-card" : ""}`}
                  >
                    <div className="card-icon">
                      {categoryData.icon}
                    </div>

                    <div className="card-info">
                      <span className="item-type">{item.tipo.toUpperCase()}</span>
                      <h3 className="item-name">
                        {item.nome} {item.admin_only && <span style={{color: '#ff6b6b'}}>(ADM)</span>}
                      </h3>
                      
                      {isOwned ? (
                        <div className="status-badge owned">Adquirido ✔️</div>
                      ) : isFree ? (
                        <div className="status-badge free">GRÁTIS</div>
                      ) : null}
                    </div>

                    {/* Botões de Compra */}
                    {!isOwned && (
                      <div className="card-actions">
                        {isFree ? (
                          <button 
                            className="btn-buy btn-free" 
                            onClick={() => buyItem(item, 'moedas')}
                          >
                            Resgatar Grátis
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn-buy btn-coin"
                              onClick={() => buyItem(item, 'moedas')}
                              disabled={!canBuyWithCoins}
                              title={!canBuyWithCoins ? "Moedas insuficientes" : ""}
                            >
                              {item.preco} 💰
                            </button>

                            {!item.admin_only && (
                              <button
                                className="btn-buy btn-ruby"
                                onClick={() => buyItem(item, 'nrubys')}
                                disabled={!canBuyWithRubys}
                                title={!canBuyWithRubys ? "nRubys insuficientes" : ""}
                              >
                                {rubyPrice} 💎
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
          </div>
        );
      })}

    </div>
  );
};

export default StorePage;