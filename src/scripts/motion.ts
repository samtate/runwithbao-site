/**
 * The page's movement, all of it optional: blocks rise in as they reach the screen, Bao's bubbles type out like
 * they do in the app, and the story's phone swaps screens as each part of the story is read. With reduced motion
 * everything is simply shown.
 */
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Rise in once, when a quarter of the block is on screen. Looping illustrations keep their .in class.
const reveal = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("in");
    reveal.unobserve(entry.target);
  }
}, { threshold: 0.25 });
document.querySelectorAll("[data-reveal]").forEach((el) => reduced ? el.classList.add("in") : reveal.observe(el));

// Bao types: letter by letter, about as fast as in the app, with the full line kept for screen readers.
const type = (el: HTMLElement) => {
  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text);
  if (reduced) return;
  el.style.minHeight = `${el.offsetHeight}px`;
  el.textContent = "";
  const shown = document.createElement("span");
  shown.setAttribute("aria-hidden", "true");
  const caret = document.createElement("i");
  caret.className = "caret";
  el.append(shown, caret);
  let i = 0;
  const step = Math.min(28, 1100 / text.length);
  const tick = () => {
    shown.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, step);
    else setTimeout(() => caret.remove(), 600);
  };
  setTimeout(tick, 250);
};
const typer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    type(entry.target as HTMLElement);
    typer.unobserve(entry.target);
  }
}, { threshold: 0.6 });
document.querySelectorAll<HTMLElement>("[data-type]").forEach((el) => typer.observe(el));

// The story: whichever step is in the middle of the screen picks the phone's screen.
const story = document.querySelector<HTMLElement>("[data-story]");
if (story) {
  const steps = [...story.querySelectorAll<HTMLElement>("[data-step]")];
  const shots = [...story.querySelectorAll<HTMLElement>(".main .shot")];
  const pick = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const key = (entry.target as HTMLElement).dataset.step!;
      story.dataset.active = key;
      shots.forEach((shot) => shot.classList.toggle("on", shot.dataset.key === key));
    }
  }, { rootMargin: "-45% 0px -45% 0px" });
  steps.forEach((step) => pick.observe(step));
}

// The pinned phone's angle on wide screens: turned beside the hero, lying flat over the first part of the
// scroll. Phones on narrow screens stay flat. One frame's work per scroll, at most.
const turned = [...document.querySelectorAll<HTMLElement>(".device.turned")];
const clamp = (n: number) => Math.min(1, Math.max(0, n));
let queued = false;
const angle = () => {
  queued = false;
  const vh = innerHeight;
  const turn = 1 - clamp(scrollY / (vh * 0.6));
  for (const el of turned) el.style.setProperty("--turn", turn.toFixed(3));
};
if (!reduced) {
  angle();
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(angle); } }, { passive: true });
  addEventListener("resize", angle);
}
