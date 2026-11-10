/**
 * Each article's illustration: a small scene drawn in the site's palette with Bao standing in it. Scenes are plain
 * SVG with no text, so the same drawing serves the article's header (inline, coloured by the page's own CSS
 * variables so dark mode follows the toggle) and the share cards and thumbnails that scripts/build-share.mjs
 * renders with sharp. Every shape carries its colour twice: a hex fill for sharp, and an `f-`/`s-` class the page
 * maps to a variable (ArticleArt.astro).
 *
 * The canvas is 800 × 400. `bao` is where he stands, in the same units: his pose's square, left and top corner.
 * `alt` describes the picture, for share cards.
 */

export const LIGHT = {
  paper: "#f4eee2", surface: "#fbf7ee", border: "#e2d8c3", ink: "#2b2118", muted: "#6f6250", accent: "#c4572f",
  accentSoft: "#f3d9cc", blue: "#5e8db5", bubble: "#c3d9ec", sage: "#7fa283", sageSoft: "#dce8da", butter: "#e7b94a",
  butterSoft: "#f6e6b4", walk: "#d9c9a8", device: "#1e1812",
};
export const DARK = {
  paper: "#1e1812", surface: "#2a2219", border: "#3b3023", ink: "#f2e8d8", muted: "#b5a58e", accent: "#e0805a",
  accentSoft: "#4a2a1e", blue: "#7fa8cc", bubble: "#2f4457", sage: "#9bbf9f", sageSoft: "#2e3e30", butter: "#e7c566",
  butterSoft: "#47391a", walk: "#7c6d55", device: "#0f0b08",
};
/** The CSS each colour stands for on the page. */
export const CSS = {
  paper: "var(--paper)", surface: "var(--surface)", border: "var(--border)", ink: "var(--ink)", muted: "var(--muted)",
  accent: "var(--accent)", accentSoft: "color-mix(in srgb, var(--accent) 20%, var(--surface))", blue: "var(--blue)",
  bubble: "var(--bubble)", sage: "var(--sage)", sageSoft: "var(--sage-soft)", butter: "var(--butter)",
  butterSoft: "var(--butter-soft)", walk: "var(--walk)", device: "var(--phone)",
};

/** Drawing helpers bound to a palette: a fill, a stroke, or both. */
function pen(c) {
  const fill = (k) => `fill="${c[k]}" class="f-${k}"`;
  const line = (k, w, extra = "") =>
    `fill="none" stroke="${c[k]}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" class="s-${k}" ${extra}`;
  const both = (f, s, w) => `fill="${c[f]}" stroke="${c[s]}" stroke-width="${w}" class="f-${f} s-${s}"`;
  const panel = (k) => `<rect width="800" height="400" rx="28" ${fill(k)}/>`;
  return { fill, line, both, panel };
}

/** Little marks of the paper: a few soft dots so a panel isn't flat. */
function sprinkle({ fill }, k, dots) {
  return dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${fill(k)} opacity=".55"/>`).join("");
}

export const SCENES = {
  /** A signpost with an arm for each distance, and a path that winds past it. */
  alternatives: {
    alt: "Bao waving beside a signpost with an arm for each distance",
    bao: { x: 500, y: 92, size: 270, mood: "wave" },
    draw(c) {
      const p = pen(c);
      const arm = (y, dir, k, w) => {
        const x = 300, left = dir < 0;
        const x0 = left ? x - w : x - 14, x1 = left ? x + 14 : x + w, tip = left ? x0 - 26 : x1 + 26;
        const shape = left
          ? `M${x0} ${y} H${x1} V${y + 46} H${x0} L${tip} ${y + 23} Z`
          : `M${x0} ${y} H${x1} L${tip} ${y + 23} L${x1} ${y + 46} H${x0} Z`;
        const tx = left ? x0 + 14 : x0 + 30;
        return `<path d="${shape}" ${p.both(k, "ink", 3)}/>` +
          `<path d="M${tx} ${y + 18} h${w * 0.55} M${tx} ${y + 30} h${w * 0.35}" ${p.line("surface", 5)} opacity=".9"/>`;
      };
      return p.panel("butterSoft") +
        sprinkle(p, "surface", [[90, 70, 7], [150, 40, 4], [700, 60, 5], [760, 120, 3], [60, 200, 4]]) +
        `<path d="M0 352 C120 330 220 360 340 344 S600 322 800 346 V400 H0 Z" ${p.fill("walk")} opacity=".7"/>` +
        `<path d="M40 380 C150 350 240 372 330 352 S520 318 640 342" ${p.line("accent", 4, 'stroke-dasharray="2 14"')}/>` +
        `<rect x="290" y="70" width="20" height="290" rx="6" ${p.both("walk", "ink", 3)}/>` +
        `<circle cx="300" cy="66" r="12" ${p.both("butter", "ink", 3)}/>` +
        arm(96, 1, "sage", 150) + arm(156, -1, "bubble", 170) + arm(216, 1, "butter", 130) + arm(276, -1, "accentSoft", 120);
    },
  },

  /** A week in a card: Tuesday's run is gone, and it lands on Thursday under an arc. */
  missed: {
    alt: "Bao thinking beside a week in which a missed run moves two days on",
    bao: { x: 548, y: 96, size: 260, mood: "think" },
    draw(c) {
      const p = pen(c);
      const slot = (i) => 92 + i * 66;
      const kinds = ["rest", "missed", "rest", "moved", "rest", "butter", "blue"];
      const slots = kinds.map((k, i) => {
        const x = slot(i), y = 214;
        if (k === "rest") return `<rect x="${x}" y="${y}" width="54" height="78" rx="14" ${p.line("border", 3, 'stroke-dasharray="7 7"')}/>`;
        if (k === "missed") return `<rect x="${x}" y="${y}" width="54" height="78" rx="14" ${p.line("accent", 3, 'stroke-dasharray="7 7"')}/>` +
          `<path d="M${x + 19} ${y + 31} l16 16 M${x + 35} ${y + 31} l-16 16" ${p.line("accent", 4)}/>`;
        if (k === "moved") return `<rect x="${x}" y="${y}" width="54" height="78" rx="14" ${p.both("sage", "ink", 3)}/>` +
          `<path d="M${x + 15} ${y + 40} l9 9 l16 -18" ${p.line("surface", 5)}/>`;
        return `<rect x="${x}" y="${y}" width="54" height="78" rx="14" ${p.both(k, "ink", 3)}/>`;
      }).join("");
      const heads = kinds.map((_, i) => `<rect x="${slot(i) + 15}" y="186" width="24" height="8" rx="4" ${p.fill("muted")} opacity=".45"/>`).join("");
      return p.panel("sageSoft") +
        sprinkle(p, "surface", [[60, 60, 6], [130, 34, 4], [740, 50, 5], [770, 330, 4]]) +
        `<rect x="66" y="150" width="490" height="172" rx="26" ${p.both("surface", "border", 2)}/>` +
        `<rect x="92" y="164" width="120" height="10" rx="5" ${p.fill("ink")} opacity=".75"/>` +
        heads + slots +
        `<path d="M${slot(1) + 27} 206 C${slot(1) + 40} 112 ${slot(3) + 14} 112 ${slot(3) + 27} 200" ${p.line("accent", 4, 'stroke-dasharray="3 10"')}/>` +
        `<path d="M${slot(3) + 15} 190 l12 12 l10 -15" ${p.line("accent", 4)}/>`;
    },
  },

  /** A watch with a workout on its face, a phone, and arrows going round between them. */
  garmin: {
    alt: "Bao cheering beside a watch showing a workout and a phone, with arrows between them",
    bao: { x: 540, y: 96, size: 260, mood: "cheer" },
    draw(c) {
      const p = pen(c);
      const bars = [[0, 26, "sage"], [1, 54, "accent"], [2, 26, "sage"], [3, 54, "accent"], [4, 26, "sage"], [5, 36, "blue"]]
        .map(([i, h, k]) => `<rect x="${150 + i * 21}" y="${232 - h}" width="15" height="${h}" rx="4" ${p.fill(k)}/>`).join("");
      return p.panel("bubble") +
        sprinkle(p, "surface", [[70, 60, 6], [740, 52, 5], [700, 340, 4], [40, 330, 4]]) +
        `<rect x="170" y="44" width="78" height="96" rx="18" ${p.fill("device")}/>` +
        `<rect x="170" y="268" width="78" height="96" rx="18" ${p.fill("device")}/>` +
        `<circle cx="209" cy="204" r="104" ${p.fill("device")}/>` +
        `<circle cx="209" cy="204" r="86" fill="#2c2620" class="f-face"/>` +
        `<path d="M209 128 A76 76 0 1 1 140 248" ${p.line("butter", 8)}/>` +
        bars +
        `<rect x="178" y="244" width="62" height="7" rx="3.5" fill="#efe6d6" class="f-dial" opacity=".8"/>` +
        `<rect x="316" y="196" width="10" height="26" rx="4" ${p.fill("device")}/>` +
        `<path d="M350 150 C392 112 430 112 452 132" ${p.line("ink", 5)}/>` +
        `<path d="M440 116 l14 18 l-21 6" ${p.line("ink", 5)}/>` +
        `<path d="M452 276 C412 310 374 306 352 284" ${p.line("ink", 5)}/>` +
        `<path d="M366 302 l-15 -18 l21 -5" ${p.line("ink", 5)}/>` +
        `<rect x="454" y="128" width="96" height="176" rx="18" ${p.fill("device")}/>` +
        `<rect x="462" y="140" width="80" height="152" rx="11" ${p.fill("surface")}/>` +
        `<rect x="471" y="156" width="62" height="24" rx="7" ${p.fill("sage")}/>` +
        `<rect x="471" y="188" width="62" height="24" rx="7" ${p.fill("butter")}/>` +
        `<rect x="471" y="220" width="62" height="24" rx="7" ${p.fill("blue")}/>` +
        `<rect x="471" y="254" width="40" height="8" rx="4" ${p.fill("muted")} opacity=".5"/>`;
    },
  },

  /** Rain on the window, Bao on the belt. */
  treadmill: {
    alt: "Bao on a treadmill while it rains outside the window",
    bao: { x: 300, y: 70, size: 250, mood: "cheer" },
    draw(c) {
      const p = pen(c);
      const drops = [[78, 92], [118, 130], [160, 86], [96, 176], [146, 196], [186, 150], [70, 232], [176, 238]]
        .map(([x, y]) => `<path d="M${x} ${y} l-7 16" ${p.line("blue", 4)}/>`).join("");
      return p.panel("accentSoft") +
        `<rect x="44" y="44" width="186" height="230" rx="18" ${p.both("bubble", "ink", 4)}/>` +
        `<path d="M137 44 V274 M44 159 H230" ${p.line("ink", 4)}/>` +
        `<path d="M74 82 c0 -16 26 -22 34 -8 c8 -14 34 -8 32 10 c14 2 14 22 -2 22 h-62 c-16 0 -16 -24 -2 -24 z" ${p.fill("surface")} opacity=".95"/>` +
        drops +
        `<rect x="30" y="274" width="214" height="16" rx="6" ${p.both("walk", "ink", 3)}/>` +
        `<path d="M0 352 H800 V400 H0 Z" ${p.fill("walk")} opacity=".55"/>` +
        `<path d="M610 316 L668 128" ${p.line("device", 14)}/>` +
        `<rect x="626" y="96" width="112" height="58" rx="14" transform="rotate(-14 682 125)" ${p.fill("device")}/>` +
        `<rect x="640" y="108" width="54" height="10" rx="5" transform="rotate(-14 682 125)" ${p.fill("sage")}/>` +
        `<rect x="640" y="126" width="34" height="10" rx="5" transform="rotate(-14 682 125)" ${p.fill("butter")}/>` +
        `<rect x="272" y="300" width="380" height="34" rx="17" ${p.fill("device")}/>` +
        `<rect x="290" y="306" width="344" height="12" rx="6" fill="#4a4038" class="f-belt"/>` +
        `<path d="M318 312 h26 M398 312 h26 M478 312 h26 M558 312 h26" ${p.line("muted", 3)} opacity=".7"/>` +
        `<rect x="288" y="334" width="22" height="22" rx="5" ${p.fill("device")}/>` +
        `<rect x="614" y="334" width="22" height="22" rx="5" ${p.fill("device")}/>`;
    },
  },

  /** A stopwatch, and five kilometre markers on the way to a flag. */
  timetrial: {
    alt: "Bao looking pleased beside a stopwatch and five kilometre markers leading to a flag",
    bao: { x: 556, y: 92, size: 250, mood: "proud" },
    draw(c) {
      const p = pen(c);
      const ticks = Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2, r1 = 70, r2 = i % 3 === 0 ? 56 : 62;
        return `M${(170 + Math.sin(a) * r1).toFixed(1)} ${(214 - Math.cos(a) * r1).toFixed(1)} L${(170 + Math.sin(a) * r2).toFixed(1)} ${(214 - Math.cos(a) * r2).toFixed(1)}`;
      }).join(" ");
      const marks = [[300, 338], [352, 300], [408, 324], [462, 290]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" ${p.both("surface", "ink", 3)}/>`).join("");
      return p.panel("butterSoft") +
        sprinkle(p, "surface", [[340, 60, 6], [420, 110, 4], [760, 60, 5], [60, 60, 4]]) +
        `<path d="M240 366 C276 350 312 336 352 300 S396 334 430 314 S470 280 512 272" ${p.line("accent", 4, 'stroke-dasharray="2 13"')}/>` +
        marks +
        `<path d="M512 272 V176" ${p.line("ink", 4)}/><path d="M512 176 h44 l-10 14 l10 14 h-44 z" ${p.both("accent", "ink", 3)}/>` +
        `<rect x="156" y="104" width="28" height="22" rx="6" ${p.both("walk", "ink", 4)}/>` +
        `<rect x="146" y="92" width="48" height="16" rx="8" ${p.both("butter", "ink", 4)}/>` +
        `<path d="M226 150 l14 -14" ${p.line("ink", 8)}/>` +
        `<circle cx="170" cy="214" r="86" ${p.both("surface", "ink", 6)}/>` +
        `<path d="M170 214 V156 A58 58 0 0 1 220 185 Z" ${p.fill("accentSoft")}/>` +
        `<path d="${ticks}" ${p.line("ink", 4)}/>` +
        `<path d="M170 214 L210 180" ${p.line("accent", 7)}/>` +
        `<circle cx="170" cy="214" r="9" ${p.fill("ink")}/>`;
    },
  },

  /** Steps back up: each week a little more, a mug of something hot on the first. */
  comeback: {
    alt: "Bao beside four steps that rise week by week, with a hot drink on the first",
    bao: { x: 524, y: 82, size: 270, mood: "happy" },
    draw(c) {
      const p = pen(c);
      const heights = [70, 120, 170, 220];
      const steps = heights.map((h, i) =>
        `<rect x="${96 + i * 100}" y="${340 - h}" width="86" height="${h}" rx="14" ${p.both(i === 3 ? "butter" : "sage", "ink", 3)}/>`
      ).join("");
      const path = heights.map((h, i) => `${i === 0 ? "M" : "L"}${139 + i * 100} ${322 - h}`).join(" ");
      return p.panel("sageSoft") +
        sprinkle(p, "surface", [[80, 64, 6], [160, 120, 4], [740, 58, 5], [470, 60, 4]]) +
        `<path d="M40 340 H500" ${p.line("ink", 3)} opacity=".35"/>` +
        steps +
        `<path d="${path}" ${p.line("accent", 4, 'stroke-dasharray="2 12"')}/>` +
        `<path d="M435 120 V60" ${p.line("ink", 4)}/><path d="M435 60 h40 l-9 12 l9 12 h-40 z" ${p.both("accent", "ink", 3)}/>` +
        `<rect x="118" y="230" width="40" height="40" rx="8" ${p.both("surface", "ink", 3)}/>` +
        `<path d="M158 240 c14 0 14 20 0 20" ${p.line("ink", 3)}/>` +
        `<path d="M128 220 c-6 -8 6 -12 0 -22 M146 220 c-6 -8 6 -12 0 -22" ${p.line("muted", 3)}/>`;
    },
  },
};

/** The scene as SVG markup for the 800 × 400 canvas, in a palette (LIGHT, DARK or CSS). */
export function drawScene(name, palette = LIGHT) {
  const scene = SCENES[name];
  if (!scene) throw new Error(`No scene called ${name}`);
  // Clipped to the panel's rounded corners, so the ground and paths don't poke out of a picture with no frame.
  return `<defs><clipPath id="scene-${name}"><rect width="800" height="400" rx="28"/></clipPath></defs>` +
    `<g clip-path="url(#scene-${name})">${scene.draw(palette)}</g>`;
}
