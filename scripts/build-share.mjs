import sharp from "sharp";
import { mkdir, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { openSync } from "fontkit";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { SCENES, drawScene, LIGHT, DARK } from "../src/illustrations/scenes.mjs";

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

/**
 * A line of text as outlines in the site's own fonts (no installed fonts or renderer substitutions). A line can mix
 * faces, as a headline does with its one italic word: `parts` is [text, face, colour] runs sharing one baseline.
 * Too wide for `maxWidth`, it's set smaller until it fits. With `baseline`, `top` is where the baseline goes, so
 * lines with and without tall letters still sit evenly.
 */
async function words(parts, size, left, top, maxWidth = Infinity, baseline = false) {
  let x = 0, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const groups = parts.map(([text, face, color]) => {
    const selected = fonts[face], run = selected.layout(text), units = selected.unitsPerEm;
    const paths = run.glyphs.map((glyph, i) => {
      const position = run.positions[i], at = x + (position.xOffset / units) * 1000, y = position.yOffset;
      x += (position.xAdvance / units) * 1000;
      if (!glyph.path.commands.length) return "";
      const k = 1000 / units;
      minX = Math.min(minX, at + glyph.bbox.minX * k); maxX = Math.max(maxX, at + glyph.bbox.maxX * k);
      minY = Math.min(minY, (y + glyph.bbox.minY) * k); maxY = Math.max(maxY, (y + glyph.bbox.maxY) * k);
      return `<path transform="translate(${at} ${y * k}) scale(${k})" d="${glyph.path.toSVG()}"/>`;
    }).join("");
    return `<g fill="${color}">${paths}</g>`;
  });
  // Every face is measured in thousandths of the type size, so runs in different fonts line up.
  const scale = Math.min(size / 1000, maxWidth / (maxX - minX));
  const width = Math.ceil((maxX - minX) * scale) + 2, height = Math.ceil((maxY - minY) * scale) + 2;
  const artwork = `<g transform="translate(${1 - minX * scale} ${1 + maxY * scale}) scale(${scale} ${-scale})">${groups.join("")}</g>`;
  const input = await sharp(svg(artwork, width, height)).png().toBuffer();
  return { input, left, top: baseline ? Math.round(top - maxY * scale - 1) : top, width, height };
}
const label = (text, face, size, left, top, color = colors.ink) => words([[text, face, color]], size, left, top);

const { poses } = JSON.parse(readFileSync("src/illustrations/bao-poses.json", "utf8"));
/** Bao in a pose, as an SVG of the given size. */
const baoSvg = (mood, size, id) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="14 26 212 212">${poses[mood].replaceAll("BAOID_", `${id}_`)}</svg>`);

// The home page's card. The picture needs to read at chat width, so the headline and Bao do most of the work.
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
const mascot = await sharp(baoSvg("happy", 212, "share")).resize(310, 310).png().toBuffer();
const labels = await Promise.all([
  label("Run With Bao", "medium", 31, 75, 66),
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

/** An article's scene with Bao standing in it, at `width` (the scene is 2:1), in a palette. */
async function art(scene, width, palette, id) {
  const { bao } = SCENES[scene];
  const k = width / 800;
  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width / 2}" viewBox="0 0 800 400">` +
    `${drawScene(scene, palette)}<svg x="${bao.x}" y="${bao.y}" width="${bao.size}" height="${bao.size}" ` +
    `viewBox="14 26 212 212" overflow="visible">${poses[bao.mood].replaceAll("BAOID_", `${id}_`)}</svg></svg>`;
  return sharp(Buffer.from(body), { density: 72 * k }).resize(width, width / 2).png({ compressionLevel: 9 }).toBuffer();
}

/**
 * Every article's pictures, from its frontmatter: `art` names its scene (src/illustrations/scenes.mjs) and `share`
 * gives its card's headline, one line each, with *one italic word* in colour as on the page. Each gets a 1200 × 630
 * share card, and its scene in light and dark for thumbnails, which the site then resizes as it needs.
 */
const pages = "src/pages/articles";
await mkdir("src/assets/share/articles", { recursive: true });
await mkdir("src/assets/art", { recursive: true });
for (const file of (await readdir(pages)).filter((f) => /\.mdx?$/.test(f)).sort()) {
  const slug = file.replace(/\.mdx?$/, "");
  const front = parse(readFileSync(`${pages}/${file}`, "utf8").split(/^---$/m)[1]);
  if (!front.art || !front.share) throw new Error(`${file} needs \`art\` and \`share\` in its frontmatter`);
  for (const [theme, palette] of [["light", LIGHT], ["dark", DARK]]) {
    await writeFile(`src/assets/art/${slug}-${theme}.png`, await art(front.art, 1200, palette, `${slug}${theme}`));
  }

  const runs = front.share.map((line) => line.split(/(\*[^*]+\*)/).filter(Boolean).map((part) => part.startsWith("*")
    ? [part.slice(1, -1), "italic", colors.accent] : [part, "serif", colors.ink]));
  // One size for every line: the largest that lets the widest fit.
  const widest = Math.max(...(await Promise.all(runs.map((parts) => words(parts, 74, 0, 0)))).map((l) => l.width));
  const size = Math.min(74, (74 * 520) / widest);
  const lines = await Promise.all(runs.map((parts, i) => words(parts, size, 72, 212 + i * 88, Infinity, true)));
  const card = await sharp(svg(`
    <rect width="1200" height="630" fill="${colors.paper}"/>
    <rect x="25" y="25" width="1150" height="580" rx="30" fill="none" stroke="${colors.border}"/>
    <rect x="1004" y="61" width="122" height="39" rx="19.5" fill="${colors.surface}" stroke="${colors.border}"/>
  `, 1200, 630)).composite([
    { input: await art(front.art, 540, LIGHT, `${slug}card`), left: 612, top: 214 },
    ...lines,
    await label("Run With Bao", "medium", 31, 75, 66),
    await label("Articles", "medium", 18, 1031, 72, colors.muted),
    await label("runwithbao.app/articles", "medium", 20, 75, 572, colors.muted),
  ]).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(`src/assets/share/articles/${slug}.png`, card);
  console.log(`Built ${slug}: share card ${Math.round(card.length / 1024)} KiB, art in light and dark`);
}
