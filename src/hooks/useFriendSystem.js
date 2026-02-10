import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient"; // Garanta que este caminho está certo

export const useFriendSystem = (currentUser) => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(
          `
          id, status, user_id_1, user_id_2,
          sender:usuarios!user_id_1(id, username, avatar_url, moedas, rank_tier),
          receiver:usuarios!user_id_2(id, username, avatar_url, moedas, rank_tier)
        `,
        )
        .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`);

      if (error) throw error;

      const confirmed = [];
      const pending = [];

      data.forEach((relation) => {
        if (relation.status === "accepted") {
          const friendData =
            relation.user_id_1 === currentUser.id
              ? relation.receiver
              : relation.sender;
          confirmed.push(friendData);
        } else if (
          relation.status === "pending" &&
          relation.user_id_2 === currentUser.id
        ) {
          pending.push({
            requestId: relation.id,
            from: relation.sender,
          });
        }
      });

      setFriends(confirmed);
      setPendingRequests(pending);
    } catch (error) {
      console.error("Erro ao buscar amigos:", error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 2. Enviar Pedido de Amizade
  const sendFriendRequest = async (targetUsername) => {
    // Evita buscar string vazia
    if (!targetUsername.trim()) return;

    try {
      console.log(`Buscando usuário: "${targetUsername}"...`);

      // Acha o ID do usuário pelo nome (usando ilike para ignorar maiúsculas)
      const { data: targetUser, error: userError } = await supabase
        .from("usuarios")
        .select("id, username") // Traz o username também para confirmar
        .ilike("username", targetUsername.trim()) // <--- MUDANÇA: ilike ignora Case Sensitive
        .single();

      // Log para ajudar a descobrir o erro
      if (userError) console.error("Erro do Supabase ao buscar:", userError);
      if (targetUser) console.log("Usuário encontrado:", targetUser);

      if (userError || !targetUser)
        return alert("Usuário não encontrado! Verifique o nome exato.");

      // Impede adicionar a si mesmo
      if (targetUser.id === currentUser.id)
        return alert("Você não pode adicionar a si mesmo!");

      // Verifica se já existe o pedido (para não duplicar)
      const { data: existingCheck } = await supabase
        .from("friendships")
        .select("*")
        .or(
          `and(user_id_1.eq.${currentUser.id},user_id_2.eq.${targetUser.id}),and(user_id_1.eq.${targetUser.id},user_id_2.eq.${currentUser.id})`,
        )
        .single();

      if (existingCheck)
        return alert("Vocês já são amigos ou existe um pedido pendente.");

      // Cria o pedido
      const { error } = await supabase.from("friendships").insert([
        {
          user_id_1: currentUser.id,
          user_id_2: targetUser.id,
          status: "pending",
        },
      ]);

      if (error) throw error;
      alert(`Pedido enviado com sucesso para ${targetUser.username}!`);
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar pedido. Veja o console (F12) para detalhes.");
    }
  };

  // 3. Aceitar Pedido
  const acceptRequest = async (friendshipId) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    fetchFriends(); // Atualiza a lista na hora
  };

  const rejectRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete() // Deleta o pedido do banco
        .eq("id", requestId);

      if (error) throw error;

      // Atualiza a lista visualmente removendo o pedido
      setPendingRequests((prev) =>
        prev.filter((req) => req.requestId !== requestId),
      );
    } catch (error) {
      console.error("Erro ao recusar:", error);
      alert("Erro ao recusar pedido.");
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    pendingRequests,
    loading,
    fetchFriends,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
  };
};
