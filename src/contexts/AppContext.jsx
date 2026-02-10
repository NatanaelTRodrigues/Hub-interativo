import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeItems, setStoreItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [globalMessages, setGlobalMessages] = useState([]);

  const fetchGlobalMessages = async () => {
    const { data, error } = await supabase
      .from("global_messages")
      .select(
        "*, usuarios(username, avatar_url, equipped_border_id, equipped_hat_id)"
      )
      .order("created_at", { ascending: false })
      .limit(50); // Pega as últimas 50

    if (!error && data) setGlobalMessages(data.reverse()); // Inverte para timeline correta
  };

  // Função para enviar mensagem
  const sendGlobalMessage = async (text) => {
    if (!profile || !text.trim()) return;
    await supabase
      .from("global_messages")
      .insert({ user_id: profile.id, content: text });
  };

  // --- SOCIAL: AMIGOS ---
  const sendFriendRequest = async (targetUserId) => {
    if (!profile) return;
    const { error } = await supabase.from("friendships").insert({
      user_id_1: profile.id,
      user_id_2: targetUserId,
      status: "pending",
    });
    if (error) alert("Erro ao enviar pedido (talvez já exista).");
    else alert("Pedido de amizade enviado!");
  };

  // --- LISTENER DO CHAT (REALTIME) ---
  useEffect(() => {
    fetchGlobalMessages();

    // Escuta novas mensagens em tempo real
    const channel = supabase
      .channel("public:global_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_messages" },
        (payload) => {
          // Quando chega mensagem nova, buscamos o usuário dono dela para mostrar avatar
          supabase
            .from("usuarios")
            .select("username, avatar_url, equipped_border_id, equipped_hat_id")
            .eq("id", payload.new.user_id)
            .single()
            .then(({ data }) => {
              const newMessage = { ...payload.new, usuarios: data };
              setGlobalMessages((prev) => [...prev, newMessage]);
            });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // --- Inicialização e Auth ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchFullUserData(session.user.id);
      else setLoading(false);
    });
    fetchStoreItems();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === "SIGNED_IN") fetchFullUserData(session.user.id);
        if (event === "SIGNED_OUT") {
          setProfile(null);
          setInventory([]);
        }
      }
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  // --- Efeito Visual do Cursor (CSS Global) ---
  useEffect(() => {
    document.body.classList.remove("has-custom-cursor");
    if (profile && profile.equipped_cursor_id && storeItems.length > 0) {
      const cursorItem = storeItems.find(
        (item) => item.id === profile.equipped_cursor_id
      );
      // Se tiver item, tiver URL e NÃO for o padrão
      if (
        cursorItem &&
        cursorItem.url_do_item &&
        cursorItem.url_do_item !== "DEFAULT"
      ) {
        document.body.classList.add("has-custom-cursor");
      }
    }
  }, [profile, storeItems]);

  // --- Funções de Busca (Fetch) ---
  const fetchFullUserData = async (userId) => {
    setLoading(true);
    const { data: profileData, error: profileError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();
    if (profileError) console.error("Erro Perfil:", profileError);
    else setProfile(profileData);

    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventario_usuarios")
      .select("id_item")
      .eq("id_usuario", userId);
    if (inventoryError) console.error("Erro Inventário:", inventoryError);
    else setInventory(inventoryData.map((item) => item.id_item));
    setLoading(false);
  };

  const fetchStoreItems = async () => {
    const { data, error } = await supabase.from("itens_da_loja").select("*");
    if (error) console.error("Erro ao buscar loja:", error);
    else setStoreItems(data);
  };

  // --- Função Genérica de Upload ---
  const uploadFile = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error } = await supabase.storage
      .from("imagens")
      .upload(filePath, file);
    if (error) {
      alert("Erro no upload: " + error.message);
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("imagens").getPublicUrl(filePath);
    return publicUrl;
  };

  // --- Funções de Jogo/Loja ---
  const addCoins = async (amount) => {
    if (!profile) return;
    const newCoinTotal = profile.moedas + amount;
    const { error } = await supabase
      .from("usuarios")
      .update({ moedas: newCoinTotal })
      .eq("id", profile.id);
    if (error) console.error("Erro moedas:", error);
    else setProfile({ ...profile, moedas: newCoinTotal });
  };

  const buyItem = async (item) => {
    if (!profile) {
      alert("Faça login para comprar!");
      return false;
    }
    const { data, error } = await supabase.rpc("handle_purchase_item", {
      item_id_to_buy: item.id,
    });
    if (error) {
      alert(`Erro: ${error.message}`);
      return false;
    }
    if (data.success) {
      alert(data.message);
      setProfile((p) => ({ ...p, moedas: p.moedas - item.preco }));
      setInventory((i) => [...i, item.id]);
      return true;
    } else {
      alert(data.message);
      return false;
    }
  };

  // --- FUNÇÃO DE EQUIPAR/DESEQUIPAR ---
  const equipItem = async (item) => {
    if (!profile) return;
    let updateData = {};

    // Função auxiliar para equipar ou desequipar (toggle)
    const toggle = (currentId, keyId) => {
      if (currentId === item.id) updateData = { [keyId]: null }; // Desequipa
      else updateData = { [keyId]: item.id }; // Equipa
    };

    switch (item.tipo) {
      case "borda":
        toggle(profile.equipped_border_id, "equipped_border_id");
        break;
      case "cursor":
      case "special-cursor":
        toggle(profile.equipped_cursor_id, "equipped_cursor_id");
        break;
      case "titulo":
        toggle(profile.equipped_title_id, "equipped_title_id");
        break;
      case "tema":
        toggle(profile.equipped_theme_id, "equipped_theme_id");
        break;
      case "chapeu":
      case "special-hat":
        toggle(profile.equipped_hat_id, "equipped_hat_id");
        break;

      case "avatar":
        if (profile.avatar_url === item.url_do_item)
          updateData = { avatar_url: null, avatar_gif_url: null };
        else
          updateData = { avatar_url: item.url_do_item, avatar_gif_url: null };
        break;
      default:
        return;
    }

    const { error } = await supabase
      .from("usuarios")
      .update(updateData)
      .eq("id", profile.id);
    if (error) alert("Erro ao alterar equipamento.");
    else setProfile((p) => ({ ...p, ...updateData }));
  };

  // --- Funções de Upload Específicas ---
  const updateAvatarUrl = async (fileOrUrl) => {
    if (!profile) return;
    let finalUrl = fileOrUrl;
    if (typeof fileOrUrl === "object") {
      const uploadedUrl = await uploadFile(fileOrUrl);
      if (!uploadedUrl) return;
      finalUrl = uploadedUrl;
    }
    const { error } = await supabase
      .from("usuarios")
      .update({ avatar_url: finalUrl, avatar_gif_url: null })
      .eq("id", profile.id);
    if (!error) {
      alert("Imagem salva!");
      setProfile((p) => ({ ...p, avatar_url: finalUrl, avatar_gif_url: null }));
    }
  };

  const updateAvatarGifUrl = async (fileOrUrl) => {
    if (!profile) return;
    let finalUrl = fileOrUrl;
    if (typeof fileOrUrl === "object") {
      const uploadedUrl = await uploadFile(fileOrUrl);
      if (!uploadedUrl) return;
      finalUrl = uploadedUrl;
    }
    const { error } = await supabase
      .from("usuarios")
      .update({ avatar_gif_url: finalUrl, avatar_url: null })
      .eq("id", profile.id);
    if (!error) {
      alert("GIF salvo!");
      setProfile((p) => ({ ...p, avatar_gif_url: finalUrl, avatar_url: null }));
    }
  };

  const updateCustomCursorUrl = async (fileOrUrl) => {
    if (!profile) return;
    let finalUrl = fileOrUrl;
    if (typeof fileOrUrl === "object") {
      const uploadedUrl = await uploadFile(fileOrUrl);
      if (!uploadedUrl) return;
      finalUrl = uploadedUrl;
    }
    const { error } = await supabase
      .from("usuarios")
      .update({ custom_cursor_url: finalUrl })
      .eq("id", profile.id);
    if (!error) {
      alert("Cursor salvo! Equipe o item especial.");
      setProfile((p) => ({ ...p, custom_cursor_url: finalUrl }));
    }
  };

  const updateCustomHatUrl = async (fileOrUrl) => {
    if (!profile) return;
    let finalUrl = fileOrUrl;
    if (typeof fileOrUrl === "object") {
      const uploadedUrl = await uploadFile(fileOrUrl);
      if (!uploadedUrl) return;
      finalUrl = uploadedUrl;
    }
    const { error } = await supabase
      .from("usuarios")
      .update({ custom_hat_url: finalUrl })
      .eq("id", profile.id);
    if (!error) {
      alert("Chapéu salvo! Equipe o item especial.");
      setProfile((p) => ({ ...p, custom_hat_url: finalUrl }));
    }
  };

  // --- ADMIN ---
  const adminAddCoins = async (amount) => {
    if (!profile || !profile.is_admin) return;
    const { error } = await supabase
      .from("usuarios")
      .update({ moedas: amount })
      .eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, moedas: amount });
      alert(`[ADM] Moedas: ${amount}`);
    }
  };
  const isAdmin = profile?.is_admin === true;
  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    profile,
    userCoins: profile?.moedas ?? 0,
    inventory,
    storeItems,
    loading,
    isAdmin,
    addCoins,
    buyItem,
    equipItem,
    adminAddCoins,
    updateAvatarUrl,
    updateAvatarGifUrl,
    updateCustomCursorUrl,
    updateCustomHatUrl,
    logout,
    globalMessages,
    sendGlobalMessage,
    sendFriendRequest,
  };

  return (
    <AppContext.Provider value={value}>
      {!loading && children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
