import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../contexts/AppContext";
import UserAvatar from "../common/UserAvatar"; // Reusa seu avatar!
import { Link } from "react-router-dom";
import "./ChatWidget.css"; // Vamos criar

const ChatWidget = () => {
  const { profile, globalMessages, sendGlobalMessage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll para o fim
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [globalMessages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendGlobalMessage(inputText);
      setInputText("");
    }
  };

  return (
    <div className={`chat-widget ${isOpen ? "open" : "closed"}`}>
      {/* Cabeçalho (Clicável para abrir/fechar) */}
      <div className="chat-header" onClick={() => setIsOpen(!isOpen)}>
        <span>💬 Chat Global</span>
        <span>{isOpen ? "▼" : "▲"}</span>
      </div>

      {isOpen && (
        <div className="chat-body">
          <div className="messages-list">
            {globalMessages.map((msg) => {
              // Verifica se a msg é minha
              const isMine = profile && msg.user_id === profile.id;

              return (
                <div
                  key={msg.id}
                  className={`chat-message ${isMine ? "mine" : "other"}`}
                >
                  {!isMine && (
                    <div className="msg-avatar">
                      {/* Gambiarra segura para usar o UserAvatar com dados parciais */}
                      {/* Idealmente criariamos um UserAvatar que aceita props diretas */}
                      <img
                        src={
                          msg.usuarios?.avatar_url ||
                          "https://via.placeholder.com/40"
                        }
                        alt="avatar"
                        className="mini-avatar"
                      />
                    </div>
                  )}
                  <div className="msg-content">
                    {!isMine && (
                      <span className="msg-user">{msg.usuarios?.username}</span>
                    )}
                    <p>{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {profile ? (
            <form className="chat-input-area" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Digite algo..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit">➤</button>
            </form>
          ) : (
            <div className="chat-login-prompt">
              <Link to="/login">Faça login para conversar</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
