import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { openSync } from "fontkit";
import { baoBody } from "../src/illustrations/bao.ts";

const colors = { paper: "#f4eee2", surface: "#fbf7ee", ink: "#2b2118", muted: "#6f6250",
  accent: "#c4572f", border: "#e2d8c3", blue: "#c3d9ec" };
function font(file) { return openSync(fileURLToPath(new URL(file, import.meta.url))); }
const fonts = {
  serif: font("./fonts/fraunces_semibold.ttf"),
  italic: font("./fonts/fraunces_semibold_italic.ttf"),
  sans: font("./fonts/archivo_regular.ttf"),
  medium: font("./fonts/archivo_medium.ttf"),
};
const svg = (body, width, height) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
);
async function label(text, face, size, left, top, color = colors.ink) {
  // Convert the actual site font to outlines: no installed fonts or renderer substitutions.
  const selected = fonts[face], run = selected.layout(text), scale = size / selected.unitsPerEm;
  let x = 0, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const paths = run.glyphs.map((glyph, i) => {
    const position = run.positions[i], at = x + position.xOffset, y = position.yOffset;
    x += position.xAdvance;
    if (!glyph.path.commands.length) return "";
    minX = Math.min(minX, at + glyph.bbox.minX); maxX = Math.max(maxX, at + glyph.bbox.maxX);
    minY = Math.min(minY, y + glyph.bbox.minY); maxY = Math.max(maxY, y + glyph.bbox.maxY);
    return `<path transform="translate(${at} ${y})" d="${glyph.path.toSVG()}"/>`;
  }).join("");
  const width = Math.ceil((maxX - minX) * scale) + 2, height = Math.ceil((maxY - minY) * scale) + 2;
  const artwork = `<g fill="${color}" transform="translate(${1 - minX * scale} ${1 + maxY * scale}) scale(${scale} ${-scale})">${paths}</g>`;
  const input = await sharp(svg(artwork, width, height)).png().toBuffer();
  return { input, left, top };
}

// The picture needs to read at chat width, so the headline and Bao do most of the work.
const background = svg(`
  <rect width="1200" height="630" fill="${colors.paper}"/>
  <rect x="25" y="25" width="1150" height="580" rx="30" fill="none" stroke="${colors.border}"/>
  <path d="M755 509 C684 478 700 396 772 376 S1046 443 1116 355"
    fill="none" stroke="${colors.blue}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 11"/>
  <rect x="971" y="61" width="155" height="39" rx="19.5" fill="${colors.surface}" stroke="${colors.border}"/>
`, 1200, 630);

const plan = await sharp(svg(`
  <rect x="3" y="7" width="384" height="279" rx="25" fill="#e2d8c3" opacity=".55"/>
  <rect x="1" y="1" width="384" height="279" rx="25" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
  <rect x="23" y="81" width="340" height="72" rx="16" fill="#dce8da"/>
  <rect x="23" y="165" width="340" height="72" rx="16" fill="#f6e6b4"/>
  <path d="M101 98v38 M101 182v38" stroke="${colors.ink}" stroke-opacity=".14"/>
`, 390, 291)).composite(await Promise.all([
  label("This week", "medium", 24, 26, 26),
  label("Thu", "medium", 22, 42, 104, "#405b43"),
  label("Easy run", "medium", 24, 121, 94, "#405b43"),
  label("30 min", "sans", 19, 121, 125, "#405b43"),
  label("Sat", "medium", 22, 43, 189, "#745c23"),
  label("parkrun", "medium", 24, 121, 178, "#745c23"),
  label("5 km", "sans", 19, 121, 209, "#745c23"),
])).png().toBuffer();
const tiltedPlan = await sharp(plan).rotate(5, { background: "#00000000" }).png().toBuffer();
const bao = svg(`<g transform="translate(6 6)">${baoBody("happy", "share-bao")}</g>`, 212, 212);
const mascot = await sharp(bao).resize(310, 310).png().toBuffer();
const labels = await Promise.all([
  label("Bao Run", "medium", 31, 75, 66),
  label("Public beta", "medium", 18, 998, 72, colors.muted),
  label("Your plan", "serif", 92, 70, 151),
  label("adjusts", "italic", 100, 69, 250, colors.accent),
  label("as you do.", "serif", 92, 70, 358),
  label("Whether it’s Couch to 5K", "sans", 26, 75, 491, colors.muted),
  label("or a marathon.", "sans", 26, 75, 527, colors.muted),
  label("runwithbao.app", "medium", 20, 75, 572, colors.muted),
]);
const image = await sharp(background).composite([
  { input: tiltedPlan, left: 720, top: 135 },
  { input: mascot, left: 822, top: 302 },
  ...labels,
]).png({ compressionLevel: 9 }).toBuffer();
await mkdir("src/assets/share", { recursive: true });
await writeFile("src/assets/share/bao.png", image);
// Keep the original image URL usable for clients that have cached older page metadata.
await writeFile("public/og.png", image);
console.log(`Built share card: 1200 × 630, ${Math.round(image.length / 1024)} KiB`);
