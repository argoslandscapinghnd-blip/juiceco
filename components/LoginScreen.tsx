"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 1: Login
// ─────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { colors, inputStyle, btnPrimary, cardStyle } from "./ui/styles";

interface Props {
  onIngresar: (usuario: string) => void;
}

export default function LoginScreen({ onIngresar }: Props) {
  const [usuario, setUsuario]               = useState("");
  const [password, setPassword]             = useState("");
  const [recordar, setRecordar]             = useState(false);

  const usuarioRef  = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const guardado = localStorage.getItem("juiceco_usuario");
    if (guardado) {
      setUsuario(guardado);
      setRecordar(true);
      setTimeout(() => passwordRef.current?.focus(), 100);
    } else {
      setTimeout(() => usuarioRef.current?.focus(), 100);
    }
  }, []);

  const handleIngresar = () => {
    if (!usuario.trim()) return;
    if (recordar) {
      localStorage.setItem("juiceco_usuario", usuario);
    } else {
      localStorage.removeItem("juiceco_usuario");
    }
    onIngresar(usuario);
  };

  return (
    <section>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32, marginTop: 24 }}>
        <div style={{ fontSize: 52, marginBottom: 6 }}>🍋</div>
        <h1 style={{ color: colors.primaryDark, margin: 0, fontSize: 30, letterSpacing: 3 }}>
          JUICE CO.
        </h1>
      </div>

      {/* Formulario */}
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, color: colors.textPrimary }}>
          Iniciar sesión
        </h2>

        <input
          ref={usuarioRef}
          placeholder="👤  Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          style={inputStyle}
          autoCapitalize="none"
        />

        <input
          ref={passwordRef}
          placeholder="🔒  Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          onKeyDown={(e) => e.key === "Enter" && handleIngresar()}
        />

        <label style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
          />
          <span style={{ fontSize: 14, color: colors.textSecondary }}>Recordarme</span>
        </label>

        <button style={btnPrimary} onClick={handleIngresar}>
          INGRESAR
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: colors.textMuted, marginTop: 16, marginBottom: 0 }}>
          © 2026 Juice Co. Todos los derechos reservados.
        </p>
      </div>
    </section>
  );
}
