import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import "./AuthPage.css";
import { useNavigate } from "react-router-dom"; // <-- 1. Importar o hook

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate(); // <-- 2. Ativar o hook

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(`Erro no login: ${error.message}`);
    } else {
      setMessage("Login bem-sucedido! Redirecionando...");
      navigate("/"); // <-- 3. Redireciona para a Home
    }
    setLoading(false);
  };

  // ... (o handleSignUp não muda) ...
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (authError) {
      setMessage(`Erro ao cadastrar: ${authError.message}`);
      setLoading(false);
      return;
    }
    const { error: profileError } = await supabase.from("usuarios").insert([
      {
        id: authData.user.id,
        username: username,
      },
    ]);
    if (profileError) {
      setMessage(`Erro ao criar perfil: ${profileError.message}`);
    } else {
      setMessage("Cadastro realizado! Você pode fazer o login.");
      setIsLogin(true);
    }
    setLoading(false);
  };

  return (
    // ... (O JSX/HTML da página não muda) ...
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isLogin ? "Login" : "Cadastro"}</h1>
        <p>{isLogin ? "Bem-vindo de volta!" : "Crie sua conta para jogar."}</p>
        <form onSubmit={isLogin ? handleLogin : handleSignUp}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Seu nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="seu-email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Cadastrar"}
          </button>
        </form>
        {message && <p className="auth-message">{message}</p>}
        <a href="#" onClick={() => setIsLogin(!isLogin)}>
          {isLogin
            ? "Não tem uma conta? Cadastre-se"
            : "Já tem uma conta? Faça o login"}
        </a>
      </div>
    </div>
  );
};

export default AuthPage;
