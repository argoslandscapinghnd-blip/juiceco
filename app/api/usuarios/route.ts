import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verificarAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = adminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: perfil } = await admin
    .from("usuarios")
    .select("rol")
    .eq("auth_id", user.id)
    .single();
  if (perfil?.rol !== "administrador") return null;
  return user;
}

export async function POST(req: NextRequest) {
  const caller = await verificarAdmin(req);
  if (!caller) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { nombre, usuario, password, telefono, rol } = await req.json();
  if (!nombre || !usuario || !password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const admin = adminClient();
  const email = `${usuario}@lemonlab.internal`;

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  });

  if (authErr) {
    return NextResponse.json({
      error: authErr.message.includes("already been registered")
        ? "Ese nombre de usuario ya existe."
        : "Error al crear: " + authErr.message,
    }, { status: 400 });
  }

  const { data: newUser, error: dbErr } = await admin
    .from("usuarios")
    .insert({ nombre, usuario, password, telefono, rol, activo: true, auth_id: authData.user.id })
    .select()
    .single();

  if (dbErr) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({
      error: dbErr.message.includes("unique")
        ? "Ese nombre de usuario ya existe."
        : "Error al crear: " + dbErr.message,
    }, { status: 400 });
  }

  return NextResponse.json({ ok: true, usuario: newUser });
}

export async function PATCH(req: NextRequest) {
  const caller = await verificarAdmin(req);
  if (!caller) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { auth_id, password } = await req.json();
  if (!auth_id || !password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const admin = adminClient();
  const { error } = await admin.auth.admin.updateUserById(auth_id, { password });
  if (error) {
    return NextResponse.json({ error: "Error al actualizar contraseña: " + error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
