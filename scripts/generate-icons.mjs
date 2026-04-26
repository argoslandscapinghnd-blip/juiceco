/**
 * generate-icons.mjs
 * Genera los íconos PWA para Lemon Lab usando sharp.
 * Ejecutar: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve } from "path";

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#14532d"/>
  <ellipse cx="256" cy="230" rx="108" ry="82" fill="#fde047" transform="rotate(-15 256 230)"/>
  <ellipse cx="232" cy="200" rx="32" ry="20" fill="#fef9c3" opacity="0.6" transform="rotate(-15 232 200)"/>
  <ellipse cx="162" cy="248" rx="22" ry="14" fill="#fde047" transform="rotate(-15 162 248)"/>
  <ellipse cx="350" cy="212" rx="22" ry="14" fill="#fde047" transform="rotate(-15 350 212)"/>
  <text x="256" y="372" font-family="Georgia, serif" font-size="72" font-weight="300" fill="white" text-anchor="middle" letter-spacing="6">Lemon</text>
  <text x="256" y="438" font-family="Georgia, serif" font-size="58" font-weight="300" font-style="italic" fill="#C9A84C" text-anchor="middle" letter-spacing="4">Lab</text>
</svg>`;

const SVG_PATH = resolve("public/icon.svg");
writeFileSync(SVG_PATH, SVG.trim());
console.log("✅ public/icon.svg creado");

const svgBuffer = Buffer.from(SVG);

const sizes = [
  { size: 512, name: "icon-512.png" },
  { size: 192, name: "icon-192.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 32,  name: "favicon-32.png" },
];

for (const { size, name } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve("public", name));
  console.log(`✅ public/${name} (${size}x${size})`);
}

const favicon32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
writeFileSync(resolve("public/favicon.ico"), favicon32);
console.log("✅ public/favicon.ico");

console.log("\nÍconos generados correctamente.");
