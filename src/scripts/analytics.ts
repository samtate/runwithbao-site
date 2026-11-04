/**
 * What visitors do on the site, sent straight to PostHog (EU) with no library and no cookies: each visit gets a
 * random id that lives only in memory, so nothing is stored on the visitor's device and no consent banner is
 * needed. Events go in small batches, and on leaving the page by beacon.
 *
 * Recorded: the page view; how far down it was scrolled (25/50/75/100% as they're reached, and the furthest on
 * leaving); each section seen and for how long; clicks on anything marked [data-cta]; and joining the waitlist,
 * the conversion. Every event carries the A/B variants the visitor saw, as PostHog's `$feature/<key>`.
 *
 * A/B tests: an element with [data-experiment="flag-key"] holds one child per variant, [data-variant="name"].
 * PostHog's flag picks the variant; the rest are removed. While the flag loads the element is hidden, for at
 * most 800 ms, after which the control shows.
 */
const KEY = "phc_BckPJ6iERzFZJ64uBP77aNwNZaSwLnwtmRFoBeiFB5wq";
const HOST = "https://eu.i.posthog.com";
const id = crypto.randomUUID();
// JSON sent as plain text: PostHog reads it the same, and the browser needn't ask permission first (no preflight).
const PLAIN = { "Content-Type": "text/plain" };
const flags: Record<string, string> = {};
let batch: object[] = [];
let timer: number | undefined;

function base() {
  return {
    $current_url: location.href,
    $pathname: location.pathname,
    $host: location.host,
    $referrer: document.referrer || "$direct",
    $screen_width: screen.width,
    $viewport_width: innerWidth,
    $lib: "bao-site",
    $process_person_profile: false,
    site: "runwithbao.app",
    ...Object.fromEntries(Object.entries(flags).map(([k, v]) => [`$feature/${k}`, v])),
  };
}

/** Records an event. Batched for a moment, so a burst of them is one request. */
export function track(event: string, props: Record<string, unknown> = {}) {
  batch.push({ event, distinct_id: id, properties: { ...base(), ...props }, timestamp: new Date().toISOString() });
  clearTimeout(timer);
  timer = setTimeout(flush, 1500) as unknown as number;
}

function flush(leaving = false) {
  if (!batch.length) return;
  const body = JSON.stringify({ api_key: KEY, batch });
  batch = [];
  if (leaving && navigator.sendBeacon) navigator.sendBeacon(`${HOST}/batch/`, new Blob([body], { type: "text/plain" }));
  else fetch(`${HOST}/batch/`, { method: "POST", body, keepalive: true, headers: PLAIN }).catch(() => {});
}

// A/B variants first, so the page view already knows which version was shown.
const experiments = [...document.querySelectorAll<HTMLElement>("[data-experiment]")];
const show = (el: HTMLElement, variant: string) => {
  if (!el.hasAttribute("data-waiting")) return;
  const options = [...el.querySelectorAll<HTMLElement>("[data-variant]")];
  const chosen = options.find((o) => o.dataset.variant === variant) ?? options[0];
  options.forEach((o) => o !== chosen && o.remove());
  el.dataset.shown = chosen.dataset.variant;
  el.removeAttribute("data-waiting");
  flags[el.dataset.experiment!] = chosen.dataset.variant!;
  track("$feature_flag_called", { $feature_flag: el.dataset.experiment, $feature_flag_response: chosen.dataset.variant });
};
experiments.forEach((el) => el.setAttribute("data-waiting", ""));
const ready = experiments.length === 0 ? Promise.resolve() : Promise.race([
  fetch(`${HOST}/flags/?v=2`, { method: "POST", headers: PLAIN, body: JSON.stringify({ api_key: KEY, distinct_id: id }) })
    .then((r) => r.json())
    .then((answer: { flags?: Record<string, { variant?: string; enabled?: boolean }>; featureFlags?: Record<string, string | boolean> }) => {
      for (const el of experiments) {
        const key = el.dataset.experiment!;
        const value = answer.flags?.[key]?.variant ?? answer.featureFlags?.[key];
        show(el, typeof value === "string" ? value : "control");
      }
    })
    .catch(() => {}),
  new Promise((done) => setTimeout(done, 800)),
]).then(() => experiments.forEach((el) => show(el, "control")));

ready.then(() => track("$pageview"));

// How far down: milestones as they're passed, and the furthest point on leaving.
let furthest = 0;
const marks = [25, 50, 75, 100];
addEventListener("scroll", () => {
  const depth = Math.round((scrollY + innerHeight) / document.documentElement.scrollHeight * 100);
  if (depth <= furthest) return;
  for (const mark of marks) if (furthest < mark && depth >= mark) track("scrolled", { percent: mark });
  furthest = depth;
}, { passive: true });

// Each section, the first time half of it is on screen, and how long it was looked at in all.
const seen = new Map<string, number>();
const watching = new Map<string, number>();
const sections = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const section = (entry.target as HTMLElement).dataset.section!;
    if (entry.isIntersecting) {
      if (!seen.has(section)) track("section_viewed", { section });
      seen.set(section, seen.get(section) ?? 0);
      watching.set(section, performance.now());
    } else if (watching.has(section)) {
      seen.set(section, seen.get(section)! + performance.now() - watching.get(section)!);
      watching.delete(section);
    }
  }
}, { threshold: 0.5 });
document.querySelectorAll("[data-section]").forEach((el) => sections.observe(el));

addEventListener("pagehide", () => {
  for (const [section, since] of watching) seen.set(section, seen.get(section)! + performance.now() - since);
  for (const [section, ms] of seen) if (ms > 500) track("section_time", { section, seconds: Math.round(ms / 1000) });
  track("$pageleave", { $prev_pageview_max_scroll_percentage: Math.min(100, furthest) / 100 });
  flush(true);
});

// Calls to action, by where they are on the page.
document.addEventListener("click", (event) => {
  const cta = (event.target as Element).closest<HTMLElement>("[data-cta]");
  if (cta) track("cta_clicked", { cta: cta.dataset.cta, text: cta.textContent?.trim() });
});
