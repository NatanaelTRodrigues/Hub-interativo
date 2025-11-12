import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Importa o Supabase

// 1. Criar o Contexto
const AppContext = createContext();

// 2. Criar o "Provedor"
export const AppProvider = ({ children }) => {
  const [session, setSession] = useState(null); // A sessão do usuário (quem está logado)
  const [profile, setProfile] = useState(null); // O perfil do 'usuarios' (username, moedas)
  const [inventory, setInventory] = useState([]); // Inventário (ainda local)
  const [loading, setLoading] = useState(true);

  // Efeito que roda UMA VEZ para pegar a sessão
  useEffect(() => {
    // Pega a sessão de login atual (se o usuário já estava logado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Se tem sessão, busca o perfil
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuta por MUDANÇAS de login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        // Se o evento é LOGADO, busca o perfil
        if (event === "SIGNED_IN") {
          fetchUserProfile(session.user.id);
        }
        // Se o evento é LOGOUT, limpa tudo
        if (event === "SIGNED_OUT") {
          setProfile(null);
          setInventory([]);
        }
      }
    );

    // Limpeza do listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Função para buscar os dados da tabela 'usuarios'
  const fetchUserProfile = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("usuarios")
      .select("*") // Busca tudo (id, username, moedas)
      .eq("id", userId) // Onde o 'id' é igual ao do usuário logado
      .single(); // Esperamos só um resultado

    if (error) {
      console.error("Erro ao buscar perfil:", error);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  // --- Funções da Loja (AGORA ATUALIZAM O BANCO) ---

  // Função para adicionar moedas
  const addCoins = async (amount) => {
    if (!profile) return; // Não faz nada se não está logado

    const newCoinTotal = profile.moedas + amount;

    // 1. Atualiza o banco de dados
    const { error } = await supabase
      .from("usuarios")
      .update({ moedas: newCoinTotal }) // Atualiza a coluna 'moedas'
      .eq("id", profile.id); // Onde o 'id' é o do usuário

    if (error) {
      console.error("Erro ao adicionar moedas:", error);
    } else {
      // 2. Atualiza o estado local (para a tela mudar na hora)
      setProfile({ ...profile, moedas: newCoinTotal });
    }
  };

  // (Ainda não vamos fazer o 'buyItem', vamos focar em carregar os dados)

  // Função de Logout
  const logout = async () => {
    await supabase.auth.signOut();
  };

  // 3. O que o cofre disponibiliza
  const value = {
    session,
    profile,
    userCoins: profile?.moedas ?? 0, // Pega as moedas do perfil, ou 0 se não logado
    inventory,
    loading,
    addCoins,
    // spendCoins, (faremos depois)
    // buyItem, (faremos depois)
    logout,
  };

  return (
    <AppContext.Provider value={value}>
      {!loading && children}
    </AppContext.Provider>
  );
};

// 4. O "Hook" (A Chave)
export const useApp = () => {
  return useContext(AppContext);
};
