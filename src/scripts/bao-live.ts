/**
 * Plays the app's own Bao animation over the still pose of any Bao marked data-bao-live, once he's on screen. The
 * player and the animation load only when the first one is about to show, and he pauses while scrolled away.
 * With reduced motion nothing loads and the drawn pose stays.
 */
type Marker = { cm: string; tm: number; dr: number };
type Player = typeof import("lottie-web").default;

let player: Promise<Player> | undefined;
let data: Promise<{ markers: Marker[] }> | undefined;
let started = false;

export function bringBaoToLife() {
  if (started) return;
  started = true;
  const baos = document.querySelectorAll<HTMLElement>("[data-bao-live]");
  if (!baos.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const playing = new Map<Element, { play(): void; pause(): void }>();
  const watch = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const anim = playing.get(entry.target);
      if (anim) entry.isIntersecting ? anim.play() : anim.pause();
      else if (entry.isIntersecting) start(entry.target as HTMLElement).then((a) => a && playing.set(entry.target, a));
    }
  }, { rootMargin: "120px" });
  baos.forEach((el) => watch.observe(el));
}

async function start(el: HTMLElement) {
  if (el.dataset.started) return;
  el.dataset.started = "1";
  player ??= import("lottie-web/build/player/lottie_light").then((m) => (m.default ?? m) as Player);
  data ??= fetch("/bao.json").then((r) => r.json());
  const [lottie, json] = await Promise.all([player, data]);
  const [clip, at] = JSON.parse(el.dataset.baoLive!) as [string, number];
  const loop = json.markers.find((m) => m.cm === clip);
  if (!loop) return;
  const box = document.createElement("div");
  box.className = "bao-live";
  el.append(box);
  const anim = lottie.loadAnimation({
    container: box, renderer: "svg", loop: true, autoplay: false,
    animationData: structuredClone(json),
    rendererSettings: { viewBoxSize: "14 26 212 212", preserveAspectRatio: "xMidYMid meet" },
  });
  await new Promise((r) => anim.addEventListener("DOMLoaded", r));
  // Start the loop exactly where the still pose was drawn, so the swap can't be seen.
  anim.playSegments([loop.tm, loop.tm + loop.dr], true);
  anim.goToAndPlay(at, true);
  el.classList.add("live");
  return anim;
}
