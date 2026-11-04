/** Bao’s shared vector shapes, used by the site and the share card. */
export type BaoMood = "neutral" | "happy" | "cheer" | "proud" | "think" | "tired";

export function baoBody(mood: BaoMood, id: string): string {
  const INK = "#2a1d2e", LINE = "#d9a867", BAND = "#5E8DB5", TAIL = "#46709A";
  
  function eyes(kind: string) {
    const y = 116;
    if (kind === "happy") {
      return `<path d="M64 119 Q76 104 88 119" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M112 119 Q124 104 136 119" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    }
    if (kind === "tired") {
      return `<path d="M65 115 Q76 123 87 115" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M113 115 Q124 123 135 115" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    }
    const dx = kind === "up" ? 4 : 0, dy = kind === "up" ? -5 : 0;
    const eye = (x: number) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="12" fill="${INK}"/>` +
      `<circle cx="${x - 4 + dx}" cy="${y - 5 + dy}" r="3.6" fill="#fff"/><circle cx="${x + 4 + dx}" cy="${y + 5 + dy}" r="1.7" fill="#fff"/>`;
    return eye(76) + eye(124);
  }
  function mouth(kind: string) {
    if (kind === "open") {
      return `<path d="M86 134 Q100 156 114 134 Z" fill="#7a2e3a" stroke="#7a2e3a" stroke-width="3" stroke-linejoin="round"/>` +
        `<path d="M92 143 Q100 150 108 143 Q100 139 92 143Z" fill="#ef7f8c"/>`;
    }
    if (kind === "flat") return `<path d="M92 140 H108" stroke="#7a4a3a" stroke-width="4" stroke-linecap="round"/>`;
    if (kind === "o") return `<ellipse cx="100" cy="142" rx="5" ry="6" fill="#7a2e3a"/>`;
    if (kind === "smug") return `<path d="M88 136 Q100 148 112 134" stroke="#7a4a3a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    return `<path d="M90 136 Q100 147 110 136" stroke="#7a4a3a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  const arm = (x: number, y: number, rot: number) =>
    `<ellipse cx="${x}" cy="${y}" rx="10" ry="15" transform="rotate(${rot} ${x} ${y})" fill="#ffe3ae" stroke="${LINE}" stroke-width="3"/>`;
  const star = (x: number, y: number, s: number) =>
    `<path class="star" transform="translate(${x} ${y}) scale(${s})" d="M0-10 L3-3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3-3Z" fill="#ffd84d"/>`;
  
  const moods = {
    neutral: { eyes: "open", mouth: "smile", arms: [arm(30, 128, 18), arm(170, 128, -18)], extra: "", lift: 0, squash: false },
    happy: { eyes: "happy", mouth: "open", arms: [arm(26, 112, 35), arm(174, 112, -35)],
      extra: star(176, 60, .9) + star(26, 70, .6), lift: 0, squash: false },
    cheer: { eyes: "happy", mouth: "open", arms: [arm(30, 78, 155), arm(170, 78, -155)],
      extra: star(40, 30, 1) + star(162, 26, .8) + star(100, 12, .7), lift: -10, squash: false },
    proud: { eyes: "happy", mouth: "smug", arms: [arm(34, 140, -25), arm(166, 140, 25)], extra: star(160, 52, .8), lift: 0,
      squash: false },
    think: { eyes: "up", mouth: "flat", arms: [arm(30, 128, 18), arm(132, 150, -62)],
      extra: `<circle cx="160" cy="58" r="4" fill="#9aa"/><circle cx="172" cy="40" r="6" fill="#9aa"/><circle cx="186" cy="18" r="9" fill="#9aa"/>`,
      lift: 0, squash: false },
    tired: { eyes: "tired", mouth: "o", arms: [arm(32, 134, 10), arm(168, 134, -10)],
      extra: `<path d="M156 78 q8 12 0 20 q-8-8 0-20z" fill="#7cc7f2" stroke="#4aa3d8" stroke-width="2"/>`, lift: 0, squash: true },
  };
  const m = moods[mood];
  return `<defs><radialGradient id="${id}" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#fff3d6"/>` +
    `<stop offset=".6" stop-color="#ffe3ae"/><stop offset="1" stop-color="#f1c27f"/></radialGradient></defs>` +
    `<ellipse cx="100" cy="188" rx="54" ry="8" fill="#000" opacity=".18"/>` +
    `<g transform="translate(0 ${m.lift})"><g ${m.squash ? 'transform="translate(0 12) scale(1.05 .92)"' : ""}>` +
    `<ellipse cx="76" cy="176" rx="22" ry="12" fill="#fff" stroke="#cdbfa8" stroke-width="3"/>` +
    `<path d="M58 176 q18 8 36 0" stroke="#C4572F" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="124" cy="176" rx="22" ry="12" fill="#fff" stroke="#cdbfa8" stroke-width="3"/>` +
    `<path d="M106 176 q18 8 36 0" stroke="#C4572F" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    m.arms.join("") +
    `<ellipse cx="100" cy="112" rx="76" ry="68" fill="url(#${id})" stroke="${LINE}" stroke-width="3.5"/>` +
    `<path d="M92 42 q8-16 16 0 q-8 6-16 0z" fill="#ffe3ae" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M82 52 q18 10 36 0" stroke="${LINE}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>` +
    `<path d="M30 94 Q100 60 170 94" stroke="${BAND}" stroke-width="15" fill="none" stroke-linecap="round"/>` +
    `<path d="M34 90 Q100 58 166 90" stroke="#fff" stroke-width="2.5" fill="none" opacity=".35" stroke-linecap="round"/>` +
    `<path d="M166 90 q16-10 20 4 q-12 4-20-4z M166 90 q14 12 18 26 q-14-4-18-26z" fill="${TAIL}"/>` +
    eyes(m.eyes) +
    `<ellipse cx="56" cy="134" rx="12" ry="7.5" fill="#ff8fa0" opacity=".6"/><ellipse cx="144" cy="134" rx="12" ry="7.5" fill="#ff8fa0" opacity=".6"/>` +
    mouth(m.mouth) + `</g>${m.extra}</g>`;
}
