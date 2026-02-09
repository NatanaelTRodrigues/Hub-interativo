import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import "./CustomCursor.css";

const CustomCursor = () => {
  const { profile, storeItems } = useApp();
  const [cursorData, setCursorData] = useState(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    // Blindagem contra carregamento
    if (!profile || !storeItems || storeItems.length === 0) {
      setCursorData(null);
      return;
    }

    if (profile.equipped_cursor_id) {
      const item = storeItems.find((i) => i.id === profile.equipped_cursor_id);

      if (item) {
        let urlToUse = item.url_do_item;
        let type = "default";

        if (urlToUse === "DEFAULT") {
          setCursorData(null);
          return;
        }

        // Lógica Especial (Upload)
        if (item.tipo === "special-cursor") {
          if (profile.custom_cursor_url) {
            urlToUse = profile.custom_cursor_url;
            type = "custom";
          } else {
            setCursorData(null);
            return;
          }
        } else {
          // Lógica Padrão (Partículas)
          const name = item.nome ? item.nome.toLowerCase() : "";
          if (name.includes("fogo")) type = "fire";
          else if (name.includes("água")) type = "water";
          else if (name.includes("raio")) type = "electric";
          else if (name.includes("tornado")) type = "wind";
        }

        if (urlToUse) setCursorData({ url: urlToUse, type });
      }
    } else {
      setCursorData(null);
    }
  }, [profile, storeItems]);

  // Partículas
  useEffect(() => {
    if (!cursorData) return;
    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
      if (Math.random() > 0.7 && cursorData.type !== "custom") {
        createParticle(e.clientX, e.clientY, cursorData);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursorData]);

  const createParticle = (x, y, data) => {
    const particle = document.createElement("div");
    particle.classList.add("cursor-particle", `particle-${data.type}`);
    const offset = (Math.random() - 0.5) * 20;
    particle.style.left = `${x + offset}px`;
    particle.style.top = `${y + offset}px`;
    particle.style.backgroundImage = `url(${data.url})`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  };

  if (!cursorData) return null;

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor cursor-${cursorData.type}`}
      style={{ backgroundImage: `url(${cursorData.url})` }}
    >
      {cursorData.type !== "custom" && <div className="cursor-glow"></div>}
    </div>
  );
};

export default CustomCursor;
