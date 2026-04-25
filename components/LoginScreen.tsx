"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 1: Login (con Supabase)
// ─────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { colors, inputStyle, btnPrimary, cardStyle } from "./ui/styles";
import { Usuario } from "./ui/types";
import { supabase } from "@/supabase";

interface Props {
  onIngresar: (usuario: Usuario) => void;
}

export default function LoginScreen({ onIngresar }: Props) {
  const [usuarioText, setUsuarioText] = useState("");
  const [password,    setPassword]    = useState("");
  const [recordar,    setRecordar]    = useState(false);
  const [error,       setError]       = useState("");
  const [cargando,    setCargando]    = useState(false);
  const [verPass,     setVerPass]     = useState(false);

  const usuarioRef  = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const guardado = localStorage.getItem("juiceco_usuario");
    if (guardado) {
      setUsuarioText(guardado);
      setRecordar(true);
      setTimeout(() => passwordRef.current?.focus(), 100);
    } else {
      setTimeout(() => usuarioRef.current?.focus(), 100);
    }
  }, []);

  const handleIngresar = async () => {
    if (!usuarioText.trim() || !password.trim()) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    setCargando(true);
    setError("");

    const { data, error: err } = await supabase
      .from("usuarios")
      .select("*")
      .eq("usuario", usuarioText.trim())
      .eq("password", password.trim())
      .eq("activo", true)
      .single();

    setCargando(false);

    if (err || !data) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    if (recordar) {
      localStorage.setItem("juiceco_usuario", usuarioText);
    } else {
      localStorage.removeItem("juiceco_usuario");
    }

    onIngresar(data as Usuario);
  };

  return (
    <section>
      <div style={{ textAlign: "center", marginBottom: 32, marginTop: 24 }}>
        <div style={{ fontSize: 52, marginBottom: 6 }}>🍋</div>
        <h1 style={{ color: colors.primaryDark, margin: 0, fontSize: 30, letterSpacing: 3 }}>
          JUICE CO.
        </h1>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18 }}>Iniciar sesión</h2>

        <input
          ref={usuarioRef}
          placeholder="👤  Usuario"
          value={usuarioText}
          onChange={(e) => setUsuarioText(e.target.value)}
          style={inputStyle}
          autoCapitalize="none"
        />

        {/* Contraseña con ojito */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            ref={passwordRef}
            placeholder="🔒  Contraseña"
            type={verPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, paddingRight: 48 }}
            onKeyDown={(e) => e.key === "Enter" && handleIngresar()}
          />
          <button
            onClick={() => setVerPass(!verPass)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              padding: 0,
              lineHeight: 1,
            }}
          >
            {verPass ? "🙈" : "👁️"}
          </button>
        </div>

        <label style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
          />
          <span style={{ fontSize: 14, color: colors.textSecondary }}>Recordarme</span>
        </label>

        {error && (
          <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>⚠️ {error}</p>
        )}

        <button
          style={{ ...btnPrimary, opacity: cargando ? 0.7 : 1 }}
          onClick={handleIngresar}
          disabled={cargando}
        >
          {cargando ? "Verificando..." : "INGRESAR"}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: colors.textMuted, marginTop: 16, marginBottom: 0 }}>
          © 2026 Juice Co. Todos los derechos reservados.
        </p>
      </div>
    </section>
  );
}
