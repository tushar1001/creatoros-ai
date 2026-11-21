/**
 * Batch-generates the CreatorOS 3D cartoon illustration set.
 * Run: bun scripts/gen-cartoons.mjs
 * Skips files that already exist. Retries each image up to 3 times.
 *
 * Requires GEMINI_API_KEY in .env (see scripts/gemini-image.mjs).
 */
import fs from "fs";
import path from "path";
import { generateImage } from "./gemini-image.mjs";

const OUT_DIR = path.join(process.cwd(), "public", "cartoon");
fs.mkdirSync(OUT_DIR, { recursive: true });

const STYLE =
  "3D cartoon clay render, glossy smooth rounded shapes, cute Pixar style character design, soft studio lighting, pastel lavender purple palette with coral and peach accents, plain soft light lavender background, centered composition, high quality, detailed, no text, no letters, no watermark";

const IMAGES = [
  ["mascot-hero", "Cheerful young Indian woman content creator with a ponytail, wearing a coral hoodie, holding a smartphone with a small ring light, waving hello with a big smile"],
  ["cartoon-scan", "Cute round robot detective wearing a detective hat, examining a smartphone through a big magnifying glass, sparkles around"],
  ["cartoon-lab", "Cute robot scientist with safety goggles holding a glowing purple flask, floating product boxes and price tags around it"],
  ["cartoon-store", "Happy young character stacking colorful building blocks that form a tiny cute storefront with a striped awning"],
  ["cartoon-launch", "Tiny cute rocket taking off with golden coins flying around it, happy character cheering below"],
  ["cartoon-celebrate", "Excited young character celebrating with both arms up, confetti and a smartphone showing a heart, party atmosphere"],
  ["fmt-course", "A cute laptop with a graduation cap on top, tiny stars around"],
  ["fmt-guide", "A cute document sheet with a pencil and a friendly checklist, slight 3D floating layers"],
  ["fmt-webinar", "A cute video camera next to a small presentation board with a play button"],
  ["fmt-consult", "A cute headset with a speech bubble and a small heart, friendly chat vibe"],
  ["fmt-community", "Three cute happy characters standing together like friends, one slightly waving"],
  ["fmt-template", "A cute stack of layered template cards with a star badge"],
  ["fmt-membership", "A cute golden crown resting on a small membership card with sparkles"],
];

async function main() {
  const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

  for (const [name, prompt] of IMAGES) {
    const outPath = path.join(OUT_DIR, `${name}.png`);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
      log(`SKIP ${name} (exists)`);
      continue;
    }
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        log(`GEN ${name} (attempt ${attempt})`);
        const buffer = await generateImage({ prompt: `${prompt}, ${STYLE}`, size: "1024x1024" });
        fs.writeFileSync(outPath, buffer);
        log(`OK ${name} (${Math.round(fs.statSync(outPath).size / 1024)} KB)`);
        ok = true;
      } catch (err) {
        log(`ERR ${name}: ${err?.message ?? err}`);
        await new Promise((r) => setTimeout(r, 2500 * attempt));
      }
    }
    if (!ok) log(`FAIL ${name}`);
  }
  log("DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
