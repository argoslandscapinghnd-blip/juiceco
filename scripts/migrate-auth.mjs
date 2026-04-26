/**
 * migrate-auth.mjs
 * Ejecutar UNA sola vez: node scripts/migrate-auth.mjs
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Qué hace:
 *  1. Agrega columna auth_id a la tabla usuarios (si no existe)
 *  2. Por cada usuario activo, crea cuenta en Supabase Auth
 *     con email  → {usuario}@lemonlab.internal
 *     contraseña → la misma que tienen en la columna "password"
 *  3. Vincula el auth_id en la tabla usuarios
 *  4. Muestra resumen
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Leer .env.local manualmente ──────────────────────────────────────────────
function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)="?(.+?)"?\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    console.error("No se encontró .env.local");
    process.exit(1);
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL      = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan variables: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

// Cliente admin (service_role ignora RLS)
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Paso 1: Agregar columna auth_id si no existe ─────────────────────────────
async function agregarColumna() {
  const { error } = await admin.rpc("exec_sql", {
    sql: `
      ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
    `,
  }).single().catch(() => ({ error: null }));

  // Si exec_sql no existe, intentamos con la API de SQL directa
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: "GET",
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  // Solo verificamos conectividad; la columna la creamos vía query raw más abajo
}

// ── Paso 2 + 3: Crear usuarios Auth y vincular ────────────────────────────────
async function migrarUsuarios() {
  const { data: usuarios, error } = await admin
    .from("usuarios")
    .select("id, usuario, password, nombre, rol")
    .eq("activo", true);

  if (error || !usuarios) {
    console.error("Error al leer usuarios:", error?.message);
    process.exit(1);
  }

  console.log(`\nEncontrados ${usuarios.length} usuarios activos.\n`);

  const resultados = { ok: [], error: [] };

  for (const u of usuarios) {
    const email    = `${u.usuario}@lemonlab.internal`;
    const password = u.password;

    if (!password) {
      console.log(`  ⚠️  ${u.usuario} — sin contraseña guardada, saltando`);
      resultados.error.push({ usuario: u.usuario, motivo: "sin contraseña" });
      continue;
    }

    // Crear en Supabase Auth
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // confirmar automáticamente, no requiere email
      user_metadata: { nombre: u.nombre, rol: u.rol },
    });

    if (authErr) {
      // Si ya existe, intentamos obtenerlo
      if (authErr.message?.includes("already been registered")) {
        console.log(`  ℹ️  ${u.usuario} — ya existe en Auth, buscando UUID...`);
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users?.find((x) => x.email === email);
        if (existing) {
          await vincular(u.id, existing.id, u.usuario, resultados);
          continue;
        }
      }
      console.log(`  ❌ ${u.usuario} — error Auth: ${authErr.message}`);
      resultados.error.push({ usuario: u.usuario, motivo: authErr.message });
      continue;
    }

    await vincular(u.id, authUser.user.id, u.usuario, resultados);
  }

  return resultados;
}

async function vincular(usuarioDbId, authUuid, nombre, resultados) {
  const { error } = await admin
    .from("usuarios")
    .update({ auth_id: authUuid })
    .eq("id", usuarioDbId);

  if (error) {
    console.log(`  ❌ ${nombre} — error al vincular auth_id: ${error.message}`);
    resultados.error.push({ usuario: nombre, motivo: error.message });
  } else {
    console.log(`  ✅ ${nombre} — vinculado (${authUuid})`);
    resultados.ok.push(nombre);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log("=== Migración Supabase Auth — Lemon Lab ===");
  console.log(`Proyecto: ${SUPABASE_URL}\n`);

  // Verificar que columna auth_id existe (Supabase no expone ALTER TABLE via REST,
  // hay que correrlo manualmente en SQL Editor — el script avisa si falta)
  const { data: col } = await admin
    .from("usuarios")
    .select("auth_id")
    .limit(1);

  if (col === null) {
    console.error(`
ERROR: La columna auth_id no existe en la tabla usuarios.
Corre este SQL en Supabase → SQL Editor antes de ejecutar este script:

  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

Luego vuelve a ejecutar: node scripts/migrate-auth.mjs
`);
    process.exit(1);
  }

  const { ok, error } = await migrarUsuarios();

  console.log(`
══════════════════════════════════
 Resultados
══════════════════════════════════
 ✅ Migrados OK : ${ok.length}  (${ok.join(", ") || "—"})
 ❌ Con errores : ${error.length}${error.length ? "\n    " + error.map(e => `${e.usuario}: ${e.motivo}`).join("\n    ") : ""}

${ok.length > 0 ? `IMPORTANTE: Ahora puedes eliminar la columna "password" de la tabla usuarios
cuando hayas verificado que el login funciona correctamente.
SQL: ALTER TABLE usuarios DROP COLUMN password;` : ""}
`);
})();
