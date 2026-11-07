// Exports Bao's still poses from public/bao.json (the app's animation, made by bao-run/scripts/mascot) into
// src/illustrations/bao-poses.json, so pages can draw him as plain SVG with no script. Run it after copying in a
// new bao.json: `node scripts/bao-poses.mjs`. It needs a Chrome or Chromium; set CHROME if it can't find one.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Each pose is a frame inside its mood's loop, so a page that animates Bao can start the loop from that frame.
export const POSES = {
  neutral: ["idle", 0],
  happy: ["happy_loop", 0],
  cheer: ["cheer_loop", 10],
  proud: ["proud_loop", 10],
  think: ["thinking_loop", 30],
  tired: ["sleepy_loop", 45],
  concerned: ["concerned_loop", 5],
  wave: ["wave_loop", 6],
};

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const cache = join(process.env.HOME, ".cache/ms-playwright");
  for (const dir of existsSync(cache) ? readdirSync(cache) : []) {
    for (const sub of ["chrome-linux64/chrome", "chrome-linux/chrome"]) {
      if (dir.startsWith("chromium-") && existsSync(join(cache, dir, sub))) return join(cache, dir, sub);
    }
  }
  return "chromium";
}

const data = readFileSync("public/bao.json", "utf8");
const markers = Object.fromEntries(JSON.parse(data).markers.map((m) => [m.cm, m.tm]));
const player = readFileSync("node_modules/lottie-web/build/player/lottie_svg.min.js", "utf8");
const page = join(tmpdir(), "bao-poses.html");
writeFileSync(page, `<!doctype html><body><script>${player}</script><script>
  const data = ${data}, poses = ${JSON.stringify(POSES)}, markers = ${JSON.stringify(markers)};
  window.result = {};
  for (const [name, [clip, at]] of Object.entries(poses)) {
    const box = document.createElement("div"); document.body.append(box);
    const a = lottie.loadAnimation({ container: box, renderer: "svg", loop: false, autoplay: false,
      animationData: JSON.parse(JSON.stringify(data)) });
    a.goToAndStop(markers[clip] + at, true);
    const svg = box.querySelector("svg");
    // Keep only what shows: hidden layers, invisible shapes and the frame clip (so jumps and stars can spill).
    svg.querySelectorAll("*").forEach((el) => {
      const noFill = el.getAttribute("fill-opacity") === "0", noStroke = !el.hasAttribute("stroke")
        || el.getAttribute("stroke-opacity") === "0";
      if (el.style.display === "none" || el.getAttribute("opacity") === "0" || (noFill && noStroke)) el.remove();
    });
    svg.querySelectorAll("[clip-path]").forEach((el) => el.removeAttribute("clip-path"));
    svg.querySelectorAll("clipPath").forEach((el) => el.remove());
    svg.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
    window.result[name] = svg.innerHTML.replace(/(\d+\.\d{2})\d+/g, "$1").replace(/ opacity="1"/g, "");
  }
</script></body>`);

const chrome = spawn(findChrome(), ["--headless=new", "--disable-gpu", "--remote-debugging-port=9335",
  `--user-data-dir=${join(tmpdir(), "bao-poses-profile")}`, `file://${page}`], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  await sleep(2000);
  const tabs = await (await fetch("http://127.0.0.1:9335/json")).json();
  const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  await sleep(500);
  ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate",
    params: { expression: "JSON.stringify(window.result)", returnByValue: true } }));
  const reply = await new Promise((r) => (ws.onmessage = (e) => r(JSON.parse(e.data))));
  const poses = JSON.parse(reply.result.result.value);
  // Ids must be unique per copy on a page; Bao.astro swaps BAOID for a fresh one each time.
  for (const k of Object.keys(poses)) poses[k] = poses[k].replaceAll("__lottie_element_", "BAOID_");
  writeFileSync("src/illustrations/bao-poses.json", JSON.stringify({ frames: POSES, poses }, null, 1) + "\n");
  console.log("wrote", Object.keys(poses).join(", "));
  ws.close();
} finally {
  chrome.kill();
}
