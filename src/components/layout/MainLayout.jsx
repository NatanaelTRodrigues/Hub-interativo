import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
// 1. Importe o novo componente
import CustomCursor from "./CustomCursor";
import ChatWidget from "../social/ChatWidget";

const MainLayout = () => {
  return (
    <div className="main-layout">
      {/* 2. Adicione ele aqui no topo */}
      <CustomCursor />

      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default MainLayout;
