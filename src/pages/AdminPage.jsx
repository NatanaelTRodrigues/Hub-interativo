import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 
import './AdminPage.css'; 

export default function AdminPage() {
  // Seu ID fixo
  const MEU_ID_SUPABASE = '2b6a3d53-b382-4c0f-83b5-a5c77add0f1a'; 

  // Estados para outros usuários
  const [userIdTarget, setUserIdTarget] = useState('');
  const [addMoedas, setAddMoedas] = useState('');
  const [addNrubys, setAddNrubys] = useState('');

  // Estados para a sua conta (inputs)
  const [minhasMoedas, setMinhasMoedas] = useState('');
  const [meusNrubys, setMeusNrubys] = useState('');

  // Estados para MOSTRAR o seu saldo atual na tela
  const [meuSaldoMoedas, setMeuSaldoMoedas] = useState(0);
  const [meuSaldoNrubys, setMeuSaldoNrubys] = useState(0);

  // Busca o seu saldo assim que a página abre
  useEffect(() => {
    async function carregarMeuSaldo() {
      const { data, error } = await supabase
        .from('usuarios')
        .select('moedas, "nRubys"') // As aspas duplas são obrigatórias aqui por causa do R maiúsculo
        .eq('id', MEU_ID_SUPABASE)
        .single();

      if (data) {
        setMeuSaldoMoedas(data.moedas || 0);
        setMeuSaldoNrubys(data.nRubys || 0);
      } else if (error) {
        console.error("Erro ao buscar saldo:", error);
      }
    }
    
    carregarMeuSaldo();
  }, []);

  // Função para injetar em QUALQUER usuário
  const handleDarSaldo = async (e) => {
    e.preventDefault();
    
    const moedasInt = parseInt(addMoedas) || 0;
    const nrubysInt = parseInt(addNrubys) || 0;

    const { error } = await supabase.rpc('adicionar_saldo', {
      p_user_id: userIdTarget,
      p_moedas: moedasInt,
      p_nrubys: nrubysInt
    });

    if (error) {
      console.error("Erro ao adicionar saldo:", error);
      alert("Erro ao adicionar saldo. Verifique o ID do usuário.");
    } else {
      alert(`Sucesso! Adicionado ${moedasInt} Moedas e ${nrubysInt} nRubys para o ID: ${userIdTarget}`);
      setAddMoedas('');
      setAddNrubys('');
      setUserIdTarget('');
    }
  };

  // Função para injetar na SUA conta
  const handleSaldoProprio = async (e) => {
    e.preventDefault();
    
    const moedasInt = parseInt(minhasMoedas) || 0;
    const nrubysInt = parseInt(meusNrubys) || 0;

    const { error } = await supabase.rpc('adicionar_saldo', {
      p_user_id: MEU_ID_SUPABASE,
      p_moedas: moedasInt,
      p_nrubys: nrubysInt
    });

    if (error) {
      console.error("Erro ao adicionar saldo na sua conta:", error);
      alert("Erro ao enviar saldo.");
    } else {
      alert(`Sucesso, Natanael! Adicionado ${moedasInt} Moedas e ${nrubysInt} nRubys na sua conta!`);
      
      // Atualiza a tela na hora somando o que você digitou com o saldo atual
      setMeuSaldoMoedas(prev => prev + moedasInt);
      setMeuSaldoNrubys(prev => prev + nrubysInt);

      // Limpa os inputs
      setMinhasMoedas('');
      setMeusNrubys('');
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-content">
        
        <header className="admin-header">
          <h1 className="admin-title">Painel de Administração</h1>
          <p className="admin-subtitle">Gerenciamento do sistema e economia.</p>
        </header>

        <div className="admin-grid">
          
          {/* CARD 1: INJETAR SALDO (OUTROS USUÁRIOS) */}
          <div className="admin-card">
            <h2 className="card-title">Injetar Saldo (Geral)</h2>
            <p className="card-desc">Adicione recursos para um usuário específico.</p>
            
            <form onSubmit={handleDarSaldo}>
              <div className="form-group">
                <label className="form-label">ID do Usuário</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ex: 123e4567-e89b-12d3..."
                  value={userIdTarget}
                  onChange={(e) => setUserIdTarget(e.target.value)}
                  required
                />
              </div>

              <div className="input-grid">
                <div>
                  <label className="form-label label-moedas">🟡 Moedas</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="0"
                    value={addMoedas}
                    onChange={(e) => setAddMoedas(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label label-nrubys">♦️ nRubys</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="0"
                    value={addNrubys}
                    onChange={(e) => setAddNrubys(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-purple">
                Transferir Saldo
              </button>
            </form>
          </div>

          {/* CARD 2: ADICIONAR NA MINHA CONTA */}
          <div className="admin-card" style={{ borderColor: '#059669' }}>
            
            <div className="card-header-flex">
              <div>
                <h2 className="card-title">Minha Conta</h2>
                <p className="card-desc">Adicione recursos ao seu perfil.</p>
              </div>
              {/* Mostrador de saldo atual na tela */}
              <div className="balance-display">
                <div className="balance-moedas">🟡 {meuSaldoMoedas}</div>
                <div className="balance-nrubys">♦️ {meuSaldoNrubys}</div>
              </div>
            </div>
            
            <form onSubmit={handleSaldoProprio}>
              <div className="input-grid mt-4">
                <div>
                  <label className="form-label label-moedas">🟡 Moedas</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="0"
                    value={minhasMoedas}
                    onChange={(e) => setMinhasMoedas(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label label-nrubys">♦️ nRubys</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="0"
                    value={meusNrubys}
                    onChange={(e) => setMeusNrubys(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-green mt-2">
                Adicionar à Minha Conta
              </button>
            </form>
          </div>

          {/* CARD 3: ADICIONAR NOVO ITEM */}
          <div className="admin-card">
            <h2 className="card-title">Criar Novo Item</h2>
            <p className="card-desc">Adicione um item à loja e defina o preço.</p>
            
            <form>
              <div className="form-group">
                <label className="form-label">Nome do Item</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ex: Espada de Fogo"
                />
              </div>

              <div className="input-grid">
                <div>
                  <label className="form-label label-moedas">Preço (Moedas)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="form-label label-nrubys">Preço (nRubys)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>

              <button type="button" className="btn btn-blue">
                Cadastrar Item
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}