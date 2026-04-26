/**
 * generate-icons.mjs
 * Genera los íconos PWA para Lemon Lab usando sharp.
 * Ejecutar: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve } from "path";

// Logo.png centrado sobre fondo verde, adaptado a cuadrado
const BG = { r: 20, g: 83, b: 45, alpha: 1 };

const sizes = [
  { size: 512, name: "icon-512.png" },
  { size: 192, name: "icon-192.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 32,  name: "favicon-32.png" },
];

for (const { size, name } of sizes) {
  await sharp("public/Logo.png")
    .resize(size, size, { fit: "contain", background: BG })
    .png()
    .toFile(resolve("public", name));
  console.log(`✅ public/${name} (${size}x${size})`);
}

const favicon32 = await sharp("public/Logo.png")
  .resize(32, 32, { fit: "contain", background: BG })
  .png()
  .toBuffer();
writeFileSync(resolve("public/favicon.ico"), favicon32);
console.log("✅ public/favicon.ico");

console.log("\nÍconos generados correctamente.");
