import sharp from "sharp";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");

const svg = readFileSync(path.join(publicDir, "favicon.svg"));

const bolt = (size) =>
  sharp(svg)
    .resize({ width: size, height: size, fit: "contain" })
    .png()
    .toBuffer();

const render = async ({ file, size, background, boltScale = 1, offY = 0 }) => {
  const bg = background
    ? sharp({
        create: { width: size, height: size, channels: 4, background },
      })
    : sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });

  const boltSize = Math.round(size * boltScale);
  const img = await bolt(boltSize);
  await bg
    .composite([
      {
        input: img,
        left: Math.round((size - boltSize) / 2),
        top: Math.round((size - boltSize) / 2 + offY),
      },
    ])
    .png()
    .toFile(path.join(publicDir, file));
  console.log("ok:", file, size + "px");
};

// logo192 / logo512: transparan, bolt penuh (reuse existing API manifest)
await render({ file: "logo192.png", size: 192 });
await render({ file: "logo512.png", size: 512 });
// maskable: background putih solid + bolt di zona aman (60%)
await render({
  file: "logo512-maskable.png",
  size: 512,
  background: { r: 255, g: 255, b: 255, alpha: 1 },
  boltScale: 0.6,
  offY: 0,
});
// apple-touch-icon: 180x180, background putih (iOS tidak support transparan)
await render({
  file: "apple-touch-icon.png",
  size: 180,
  background: { r: 255, g: 255, b: 255, alpha: 1 },
  boltScale: 0.8,
  offY: 0,
});