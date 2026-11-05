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

// Looping illustrations pause while off screen.
const loops = new IntersectionObserver((entries) => {
  for (const entry of entries) entry.target.classList.toggle("rest", !entry.isIntersecting);
});
document.querySelectorAll("[data-loop]").forEach((el) => loops.observe(el));

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
// scroll. Beside the hero it drifts gently on its own; scrolling eases it from wherever the drift has it to the
// scroll's angle, and the drift fades out as it flattens. Phones on narrow screens are flat and never touched.
const turned = [...document.querySelectorAll<HTMLElement>(".device.turned")];
const clamp = (n: number) => Math.min(1, Math.max(0, n));
let shown = 1; // The angle on screen, chasing the scroll's.
let running = false;
const frame = (now: number) => {
  const target = 1 - clamp(scrollY / (innerHeight * 0.6));
  shown += (target - shown) * 0.12;
  if (Math.abs(target - shown) < 0.001) shown = target;
  const t = now / 1000;
  // Two slow waves out of step, so the drift never visibly repeats. Gone once the phone lies flat.
  const sway = shown * shown;
  for (const el of turned) {
    if (!el.offsetParent) continue; // Hidden on narrow screens.
    el.style.setProperty("--turn", shown.toFixed(4));
    el.style.setProperty("--sway-y", (sway * (Math.sin(t * 0.55) * 7 + Math.sin(t * 0.21) * 3)).toFixed(3) + "deg");
    el.style.setProperty("--sway-x", (sway * Math.sin(t * 0.43 + 1) * 3.5).toFixed(3) + "deg");
  }
  // Keep going while it drifts or is still catching up; stop once it's flat and settled.
  running = shown > 0 || target > 0;
  if (running) requestAnimationFrame(frame);
};
const wake = () => { if (!running && turned.some((el) => el.offsetParent)) { running = true; requestAnimationFrame(frame); } };
if (!reduced) {
  wake();
  addEventListener("scroll", wake, { passive: true });
  addEventListener("resize", wake);
}

// The scroll-down nudge: gone for good as soon as the page moves.
const more = document.querySelector<HTMLElement>("[data-more]");
if (more) {
  const hide = () => { if (scrollY > 8) { more.classList.add("gone"); removeEventListener("scroll", hide); } };
  hide();
  addEventListener("scroll", hide, { passive: true });
}
