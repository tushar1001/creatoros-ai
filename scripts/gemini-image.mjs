/**
 * Minimal image-generation helper for the asset scripts.
 * Uses the Gemini image model via the generativelanguage REST API.
 *
 * Env:
 *   GEMINI_API_KEY     (required)
 *   GEMINI_IMAGE_MODEL (optional, default: gemini-2.5-flash-image)
 */
import fs from "fs";

const ASPECT_RATIOS = [
  ["1:1", 1],
  ["2:3", 2 / 3],
  ["3:2", 3 / 2],
  ["3:4", 3 / 4],
  ["4:3", 4 / 3],
  ["4:5", 4 / 5],
  ["5:4", 5 / 4],
  ["9:16", 9 / 16],
  ["16:9", 16 / 9],
  ["21:9", 21 / 9],
];

function nearestAspectRatio(w, h) {
  const target = w / h;
  let best = "1:1";
  let bestDiff = Infinity;
  for (const [label, ratio] of ASPECT_RATIOS) {
    const diff = Math.abs(ratio - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = label;
    }
  }
  return best;
}

function parseSize(size) {
  const m = /^(\d+)x(\d+)$/.exec(String(size || "").trim());
  return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
}

async function requestImage(apiKey, model, prompt, aspectRatio) {
  const generationConfig = { responseModalities: ["IMAGE"] };
  if (aspectRatio) generationConfig.imageConfig = { aspectRatio };

  const res = await fetch(`${BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 160)}` : ""}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const inline = parts.find((p) => p.inlineData?.data);
  const b64 = inline?.inlineData?.data;
  if (!b64) throw new Error("no image returned by model");
  return Buffer.from(b64, "base64");
}

/**
 * Generate one image and return a PNG Buffer.
 * `size` ("WxH") is mapped to the nearest supported aspect ratio.
 */
export async function generateImage({ prompt, size }) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY not set - add it to your .env file");

  const model = process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";
  const parsed = parseSize(size);
  const aspectRatio = parsed ? nearestAspectRatio(parsed.w, parsed.h) : null;

  try {
    return await requestImage(apiKey, model, prompt, aspectRatio);
  } catch (err) {
    // Older model revisions may not support imageConfig - retry without it.
    if (aspectRatio && String(err?.message ?? "").includes("imageConfig")) {
      return requestImage(apiKey, model, prompt, null);
    }
    throw err;
  }
}

/** Save helper used by the asset scripts. */
export function saveImage(outPath, buffer, minBytes = 10_000) {
  fs.mkdirSync(outPath.substring(0, outPath.lastIndexOf("/")), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  return fs.statSync(outPath).size >= minBytes;
}
