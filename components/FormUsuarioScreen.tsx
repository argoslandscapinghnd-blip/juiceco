"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla: Crear / Editar Usuario (con Supabase)
// ─────────────────────────────────────────────
import { useState } from "react";
import { Header } from "./ui/components";
import { colors, inputStyle, btnPrimary, btnSecondary, cardStyle } from "./ui/styles";
import { Usuario } from "./ui/types";
import { supabase } from "@/supabase";

interface Props {
  usuarioEditar?: Usuario;
  onGuardar: () => void;
  onBack: () => void;
}

const capitalizarNombre = (valor: string) => {
  return valor.replace(/\b\p{L}/gu, (letra) => letra.toUpperCase());
};

const limpiarUsuario = (valor: string) => {
  return valor.toLowerCase().replace(/\s/g, "");
};

const formatearTelefono = (valor: string) => {
  const digitos = valor.replace(/\D/g, "").replace(/^504/, "").slice(0, 8);
  const separado =
    digitos.length > 4
      ? `${digitos.slice(0, 4)}-${digitos.slice(4)}`
      : digitos;

  return `+504${separado ? ` ${separado}` : " "}`;
};

export default function FormUsuarioScreen({ usuarioEditar, onGuardar, onBack }: Props) {
  const editando = !!usuarioEditar;

  const [nombre, setNombre] = useState(capitalizarNombre(usuarioEditar?.nombre ?? ""));
  const [usuario, setUsuario] = useState(limpiarUsuario(usuarioEditar?.usuario ?? ""));
  const [password, setPassword] = useState(usuarioEditar?.password ?? "");
  const [telefono, setTelefono] = useState(formatearTelefono(usuarioEditar?.telefono ?? ""));
  const [rol, setRol] = useState<"cajero" | "administrador">(usuarioEditar?.rol ?? "cajero");
  const [error, setError] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleGuardar = async () => {
    const nombreFinal = capitalizarNombre(nombre.trim());
    const usuarioFinal = limpiarUsuario(usuario.trim());
    const telefonoFinal = formatearTelefono(telefono).trim();

    const digitosTelefono = telefonoFinal.replace(/\D/g, "").replace(/^504/, "");

    if (!nombreFinal) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!usuarioFinal) {
      setError("El usuario es obligatorio.");
      return;
    }

    if (!editando && !password.trim()) {
      setError("La contraseña es obligatoria.");
      return;
    }

    if (password && password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    if (digitosTelefono.length > 0 && digitosTelefono.length !== 8) {
      setError("El teléfono debe tener 8 dígitos.");
      return;
    }

    setCargando(true);
    setError("");

    if (editando) {
      const updates: Record<string, string> = {
        nombre: nombreFinal,
        usuario: usuarioFinal,
        telefono: telefonoFinal,
        rol,
      };

      if (password) updates.password = password;

      const { error: err } = await supabase
        .from("usuarios")
        .update(updates)
        .eq("id", usuarioEditar.id);

      if (err) {
        setError("Error al guardar: " + err.message);
        setCargando(false);
        return;
      }
    } else {
      const { error: err } = await supabase
        .from("usuarios")
        .insert({
          nombre: nombreFinal,
          usuario: usuarioFinal,
          password,
          telefono: telefonoFinal,
          rol,
          activo: true,
        });

      if (err) {
        setError(
          err.message.includes("unique")
            ? "Ese nombre de usuario ya existe."
            : "Error al crear: " + err.message
        );
        setCargando(false);
        return;
      }
    }

    setCargando(false);
    onGuardar();
  };

  return (
    <section>
      <Header titulo={editando ? "Editar usuario" : "Nuevo usuario"} onBack={onBack} />

      <div style={cardStyle}>
        {editando && usuarioEditar?.id && (
          <>
            <label style={labelStyle}>ID de usuario</label>
            <input value={usuarioEditar.id} disabled style={{ ...inputStyle, opacity: 0.7 }} />
          </>
        )}

        <label style={labelStyle}>Nombre completo</label>
        <input
          placeholder="Ana López"
          value={nombre}
          onChange={(e) => setNombre(capitalizarNombre(e.target.value))}
          style={inputStyle}
        />

        <label style={labelStyle}>Usuario (para iniciar sesión)</label>
        <input
          placeholder="ana.lopez"
          value={usuario}
          onChange={(e) => setUsuario(limpiarUsuario(e.target.value))}
          style={inputStyle}
          autoCapitalize="none"
        />

        <label style={labelStyle}>Contraseña</label>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            placeholder="Mínimo 4 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={verPass ? "text" : "password"}
            style={{ ...inputStyle, marginBottom: 0, paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setVerPass(!verPass)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            {verPass ? "🙈" : "👁️"}
          </button>
        </div>

        <label style={labelStyle}>Teléfono (opcional)</label>
        <input
          placeholder="+504 9999-9999"
          value={telefono}
          type="tel"
          style={inputStyle}
          onChange={(e) => {
            const valor = e.target.value;

            if (!valor.startsWith("+504")) {
              setTelefono(formatearTelefono(valor));
              return;
            }

            setTelefono(formatearTelefono(valor));
          }}
          onFocus={(e) => {
            setTimeout(() => {
              const pos = e.target.value.indexOf(" ") + 1;
              e.target.setSelectionRange(pos, pos);
            }, 0);
          }}
          onClick={(e) => {
            const input = e.target as HTMLInputElement;
            const prefijoFin = input.value.indexOf(" ") + 1;

            if (input.selectionStart! < prefijoFin) {
              input.setSelectionRange(prefijoFin, prefijoFin);
            }
          }}
          onKeyDown={(e) => {
            const input = e.currentTarget;
            const prefijoFin = input.value.indexOf(" ") + 1;

            if (
              (e.key === "Backspace" && input.selectionStart! <= prefijoFin) ||
              (e.key === "ArrowLeft" && input.selectionStart! <= prefijoFin)
            ) {
              e.preventDefault();
            }
          }}
        />

        <label style={labelStyle}>Rol</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {(["cajero", "administrador"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRol(r)}
              style={{
                padding: "14px 10px",
                borderRadius: 12,
                border: `2px solid ${rol === r ? colors.primary : colors.border}`,
                background: rol === r ? colors.primaryLight : "white",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 28 }}>{r === "administrador" ? "🛡️" : "👤"}</span>
              <span
                style={{
                  fontWeight: "bold",
                  fontSize: 13,
                  color: rol === r ? colors.primary : colors.textSecondary,
                }}
              >
                {r === "administrador" ? "Administrador" : "Cajero"}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>
            ⚠️ {error}
          </p>
        )}

        <button
          style={{ ...btnPrimary, opacity: cargando ? 0.7 : 1 }}
          onClick={handleGuardar}
          disabled={cargando}
        >
          {cargando ? "Guardando..." : `💾 ${editando ? "GUARDAR CAMBIOS" : "CREAR USUARIO"}`}
        </button>

        <button style={{ ...btnSecondary, marginTop: 10 }} onClick={onBack}>
          CANCELAR
        </button>
      </div>
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: "bold",
  color: "#555",
  marginBottom: 6,
};