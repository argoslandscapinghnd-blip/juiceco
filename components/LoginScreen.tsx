"use client";
// ─────────────────────────────────────────────
//  Lemon Lab — Pantalla 1: Login (con Supabase)
// ─────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { colors, inputStyle, btnPrimary, cardStyle } from "./ui/styles";
import { Usuario } from "./ui/types";
import { supabase } from "@/supabase";

interface SesionActiva {
  id:            number;
  sucursal_id:   number;
  fondo_inicial: number;
  sucursal:      { nombre: string; codigo: string };
}

interface Props {
  onIngresar: (usuario: Usuario, sesionActiva?: SesionActiva) => void;
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
    const guardado = localStorage.getItem("juiceco_ultimo_usuario");
    if (guardado) {
      setUsuarioText(guardado);
      setRecordar(true);
      setTimeout(() => passwordRef.current?.focus(), 100);
    } else {
      setTimeout(() => usuarioRef.current?.focus(), 100);
    }
    const recuerdaPreferencia = localStorage.getItem("juiceco_recordar");
    if (recuerdaPreferencia === "true") setRecordar(true);
  }, []);

  const handleIngresar = async () => {
    if (!usuarioText.trim() || !password.trim()) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    setCargando(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email:    `${usuarioText.trim()}@lemonlab.internal`,
      password: password.trim(),
    });

    if (authError || !authData.user) {
      setCargando(false);
      setError("Usuario o contraseña incorrectos.");
      setPassword("");
      setVerPass(false);
      setTimeout(() => passwordRef.current?.focus(), 100);
      return;
    }

    const { data: userData, error: errPerfil } = await supabase
      .from("usuarios")
      .select("*")
      .eq("auth_id", authData.user.id)
      .eq("activo", true)
      .single();

    if (errPerfil || !userData) {
      await supabase.auth.signOut();
      setCargando(false);
      setError("Cuenta inactiva o sin perfil configurado.");
      setPassword("");
      setVerPass(false);
      setTimeout(() => passwordRef.current?.focus(), 100);
      return;
    }

    const { data: sesionData } = await supabase
      .from("sesiones_caja")
      .select("id, sucursal_id, fondo_inicial, sucursales(nombre, codigo)")
      .eq("usuario_id", userData.id)
      .eq("activa", true)
      .single();

    setCargando(false);

    localStorage.setItem("juiceco_ultimo_usuario", usuarioText.trim());
    localStorage.setItem("juiceco_recordar", recordar ? "true" : "false");

    if (sesionData) {
      const sesion: SesionActiva = {
        id:            sesionData.id,
        sucursal_id:   sesionData.sucursal_id,
        fondo_inicial: sesionData.fondo_inicial ?? 0,
        sucursal:      (sesionData as any).sucursales,
      };
      onIngresar(userData as Usuario, sesion);
    } else {
      onIngresar(userData as Usuario);
    }
  };

  return (
    <section>
      <div style={{ textAlign: "center", marginBottom: 32, marginTop: 24 }}>
        <div style={{ lineHeight: 1, marginBottom: 4 }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 300,
            fontSize: 38,
            letterSpacing: "0.18em",
            color: colors.primaryDark,
            display: "block",
            lineHeight: 1,
          }}>Lemon</span>
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: 38,
            letterSpacing: "0.1em",
            color: "#C9A84C",
            display: "block",
            lineHeight: 1,
          }}>Lab</span>
          <span style={{
            fontFamily: "Georgia, serif",
            fontSize: 8,
            letterSpacing: "0.42em",
            textTransform: "uppercase" as const,
            color: colors.primaryDark,
            opacity: 0.4,
            display: "block",
            marginTop: 6,
          }}>Limonadas artesanales</span>
        </div>
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
              position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)", background: "none",
              border: "none", cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1,
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
          © 2026 Lemon Lab. Todos los derechos reservados.
        </p>
      </div>
    </section>
  );
}