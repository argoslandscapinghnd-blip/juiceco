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
    const { destinatarios, asunto, pdfBase64, fileName } = await req.json();

    if (!destinatarios || destinatarios.length === 0)
      return NextResponse.json({ error: "Sin destinatarios" }, { status: 400 });

    await transporter.sendMail({
      from: `"Juice Co. POS" <${process.env.GMAIL_USER}>`,
      to:   destinatarios.join(","),
      subject: asunto,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
          <div style="background:#14532d;color:white;padding:16px 20px;border-radius:12px;text-align:center;margin-bottom:16px">
            <h2 style="margin:0">🍋 JUICE CO.</h2>
            <p style="margin:4px 0 0;opacity:.8;font-size:13px">Dashboard adjunto en PDF</p>
          </div>
          <p style="color:#374151;font-size:14px">Hola,</p>
          <p style="color:#374151;font-size:14px">Se adjunta el reporte del dashboard de Juice Co. en formato PDF.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:20px">juiceco.vercel.app · Generado automáticamente</p>
        </div>`,
      attachments: [{
        filename: fileName || "dashboard-juiceco.pdf",
        content:  pdfBase64,
        encoding: "base64",
        contentType: "application/pdf",
      }],
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Email PDF error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
