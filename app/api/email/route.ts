import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { destinatarios, asunto, html } = await req.json();

    if (!destinatarios || destinatarios.length === 0) {
      return NextResponse.json({ error: "Sin destinatarios" }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"Juice Co. POS" <${process.env.GMAIL_USER}>`,
      to:   destinatarios.join(","),
      subject: asunto,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Email error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
