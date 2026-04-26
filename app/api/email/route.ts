import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    // Verificar JWT de Supabase
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { destinatarios, asunto, html } = await req.json();

    if (!destinatarios?.length || !asunto || !html) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      return NextResponse.json({ error: "Credenciales de email no configuradas" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Lemon Lab" <${process.env.GMAIL_USER}>`,
      to: (destinatarios as string[]).join(", "),
      subject: asunto,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Email route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
