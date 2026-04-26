import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
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
