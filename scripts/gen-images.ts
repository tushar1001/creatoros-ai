/**
 * Generates photorealistic Indian creator photography for the landing page.
 * Run: bun scripts/gen-images.ts
 *
 * Requires GEMINI_API_KEY in .env (see scripts/gemini-image.mjs).
 */
import fs from "fs";
import path from "path";
import { generateImage } from "./gemini-image.mjs";

type Job = { file: string; size: string; prompt: string };

const JOBS: Job[] = [
  // Hero carousel — portrait creator stories
  {
    file: "creators/fitness.png",
    size: "768x1344",
    prompt:
      "Photorealistic vertical photo of a fit Indian woman in her late twenties wearing teal athletic wear, doing a bridge workout on a coral yoga mat in a bright modern Indian living room, smartphone on a small tripod recording her, soft sunlight through the window, candid fitness influencer content aesthetic, natural skin tones, shallow depth of field, realistic photography, high quality",
  },
  {
    file: "creators/food.png",
    size: "768x1344",
    prompt:
      "Photorealistic vertical photo of a cheerful Indian woman in her thirties wearing a simple cotton kurti and linen apron, cooking golden dosas on a tawa griddle in a warm modern Indian kitchen with steel containers and spice jars, smartphone on an overhead tripod filming her hands, gentle steam rising, candid food creator aesthetic, natural lighting, realistic photography, high quality",
  },
  {
    file: "creators/finance.png",
    size: "768x1344",
    prompt:
      "Photorealistic vertical photo of a confident young Indian man in a smart navy casual shirt sitting at a wooden desk with a laptop showing colorful stock market charts, small ring light and clip microphone, notebook with handwritten notes, warm home office in an Indian apartment, finance content creator recording a video, natural skin tones, realistic photography, high quality",
  },
  {
    file: "creators/fashion.png",
    size: "768x1344",
    prompt:
      "Photorealistic vertical photo of a stylish young Indian woman taking a mirror selfie with her phone, wearing an elegant Indo-western outfit with statement jhumka earrings, cozy boutique bedroom with plants and warm fairy lights, fashion influencer aesthetic, natural skin tones, realistic photography, high quality",
  },

  // Step cards — square
  {
    file: "creators/step-scan.png",
    size: "1024x1024",
    prompt:
      "Photorealistic photo of a smiling Indian woman content creator sitting at a desk filming an intro video with her smartphone on a tripod and a small ring light, colorful Indian home background with shelves and plants, candid creator aesthetic, natural lighting, realistic photography, high quality, square composition",
  },
  {
    file: "creators/step-lab.png",
    size: "1024x1024",
    prompt:
      "Photorealistic photo of a young Indian man creator at a wooden desk looking thoughtfully at a laptop screen showing colorful product cards and pricing charts, open notebook with sketches, a cup of chai, warm Indian home office, candid working pose, natural lighting, realistic photography, high quality, square composition",
  },
  {
    file: "creators/step-store.png",
    size: "1024x1024",
    prompt:
      "Photorealistic photo of a happy Indian woman creator holding up her smartphone showing a colorful online shop page, packaging boxes and a courier bag on the table in front of her, bright Indian home studio background, candid creator aesthetic, natural lighting, realistic photography, high quality, square composition",
  },
  {
    file: "creators/celebrate.png",
    size: "1024x1024",
    prompt:
      "Photorealistic photo of an excited Indian woman creator celebrating with both fists raised while looking at her smartphone, colorful confetti falling around her, joyful expression, softly blurred Indian home background, candid celebration aesthetic, natural skin tones, realistic photography, high quality, square composition",
  },

  // Floating product cards — square product photography
  {
    file: "products/fitness-kit.png",
    size: "1024x1024",
    prompt:
      "Product photography of a premium home fitness kit: fabric resistance bands in coral and purple, two small hex dumbbells and a skipping rope arranged neatly on a soft cream background, studio lighting, e-commerce catalogue style, photorealistic, high quality, square",
  },
  {
    file: "products/spice-box.png",
    size: "1024x1024",
    prompt:
      "Product photography of a polished stainless steel Indian masala dabba spice box with seven round compartments filled with colorful Indian spices like turmeric, chilli powder and coriander, on a warm cream background, studio lighting, e-commerce catalogue style, photorealistic, high quality, square",
  },
  {
    file: "products/finance-planner.png",
    size: "1024x1024",
    prompt:
      "Product photography of an elegant hardbound personal finance planner journal in deep purple with subtle gold foil detailing, open page showing a neat budget table, a brass pen resting beside it, warm cream background, studio lighting, e-commerce catalogue style, photorealistic, high quality, square",
  },
];

const ROOT = path.join(process.cwd(), "public");

async function generate(job: Job, attempt = 1): Promise<void> {
  const out = path.join(ROOT, job.file);
  if (fs.existsSync(out) && fs.statSync(out).size > 20_000) {
    console.log(`skip ${job.file} (exists)`);
    return;
  }
  try {
    const buffer = await generateImage({ prompt: job.prompt, size: job.size });
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buffer);
    console.log(`ok  ${job.file}`);
  } catch (err) {
    if (attempt < 3) {
      console.log(`retry ${job.file} (attempt ${attempt})`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return generate(job, attempt + 1);
    }
    console.error(`FAIL ${job.file}: ${err instanceof Error ? err.message : err}`);
  }
}

async function main() {
  const CONCURRENCY = 3;
  let i = 0;
  async function worker() {
    while (i < JOBS.length) {
      const job = JOBS[i++];
      await generate(job);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log("done");
}

main();
