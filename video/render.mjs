// Render a scene config to frames with headless Chromium and pipe them into ffmpeg.
//   node video/render.mjs <cfg>                → video/raw/<cfg>.mp4 (near-lossless master)
//   node video/render.mjs <cfg> --stills 3,15  → video/raw/stills/<cfg>-<t>.png
// Needs Playwright (global install is fine: npm i -g playwright && npx playwright install chromium).
import { spawn, execSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch {
  pw = require(join(execSync("npm root -g").toString().trim(), "playwright"));
}

const [cfg = "master", flag, list] = process.argv.slice(2);
const raw = join(here, "raw");
mkdirSync(join(raw, "stills"), { recursive: true });

const browser = await pw.chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });  // headless, throwaway profile
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, "scenes", "app.html")).href + "?cfg=" + cfg);
await page.evaluate(() => document.fonts.ready);
const info = await page.evaluate(() => window.setup());
await page.setViewportSize({ width: info.w, height: info.h });
const clip = { x: 0, y: 0, width: info.w, height: info.h };

async function frame(t) {
  await page.evaluate((t) => window.render(t), t);
  return page.screenshot({ clip, type: "png" });
}

if (flag === "--stills") {
  for (const t of list.split(",").map(Number)) {
    const out = join(raw, "stills", `${cfg}-${String(t).padStart(5, "0")}.png`);
    await page.evaluate((t) => window.render(t), t);
    await page.screenshot({ clip, path: out });
    console.log(out);
  }
} else {
  const n = Math.round(info.dur * info.fps);
  const out = join(raw, `${cfg}.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(info.fps), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "10", "-pix_fmt", "yuv444p", out], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < n; i++) {
    const buf = await frame(i / info.fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 150 === 0) console.log(`${cfg}: frame ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(out);
}
await browser.close();
