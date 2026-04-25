#!/usr/bin/env node
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith("--")) {
      continue;
    }
    const key = current.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function hasFfmpeg() {
  const result = spawnSync("ffmpeg", ["-version"], {
    stdio: "ignore"
  });
  return result.status === 0;
}

function runFfmpeg(framesDir, outputGifPath) {
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "2",
      "-i",
      join(framesDir, "frame-%02d.png"),
      "-vf",
      "scale=1280:-1:flags=lanczos,fps=10",
      outputGifPath
    ],
    { stdio: "inherit" }
  );

  return result.status === 0;
}

async function capture() {
  const args = parseArgs(process.argv.slice(2));
  const targetUrl = String(args.url || "http://localhost:8080");
  const outDir = resolve(projectRoot, String(args.out || "showcase/generated"));
  const framesDir = join(outDir, "frames");

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("Playwright is required for capture.");
    console.error("Install with: npm install --save-dev playwright");
    console.error("Then install browser: npx playwright install chromium");
    process.exit(1);
  }

  ensureDir(outDir);
  ensureDir(framesDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1728, height: 1080 }
  });
  const page = await context.newPage();

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("main", { timeout: 15_000 });

  const desktopNight = join(outDir, "01-night-desktop.png");
  await page.screenshot({ path: desktopNight, fullPage: true });

  await page.click("#theme-toggle");
  await page.waitForTimeout(220);
  const desktopDay = join(outDir, "02-day-desktop.png");
  await page.screenshot({ path: desktopDay, fullPage: true });

  await page.click("#theme-toggle");
  await page.waitForTimeout(180);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileNight = join(outDir, "03-mobile-night.png");
  await page.screenshot({ path: mobileNight, fullPage: true });

  await page.setViewportSize({ width: 1728, height: 1080 });
  await page.waitForTimeout(180);

  const frameStates = [
    { theme: "night", modeButton: "#mode-sender" },
    { theme: "night", modeButton: "#mode-receiver" },
    { theme: "day", modeButton: "#mode-receiver" },
    { theme: "day", modeButton: "#mode-sender" },
    { theme: "night", modeButton: "#mode-sender" }
  ];

  for (let i = 0; i < frameStates.length; i += 1) {
    const frame = frameStates[i];
    const bodyTheme = await page.evaluate(() => document.body.dataset.theme);
    if (bodyTheme !== frame.theme) {
      await page.click("#theme-toggle");
      await page.waitForTimeout(180);
    }
    await page.click(frame.modeButton);
    await page.waitForTimeout(220);
    const framePath = join(framesDir, `frame-${String(i + 1).padStart(2, "0")}.png`);
    await page.screenshot({ path: framePath, fullPage: true });
  }

  await browser.close();

  console.log(`Saved screenshots to ${outDir}`);
  if (hasFfmpeg()) {
    const gifPath = join(outDir, "showcase-preview.gif");
    const ok = runFfmpeg(framesDir, gifPath);
    if (ok) {
      console.log(`Generated GIF: ${gifPath}`);
    } else {
      console.log("FFmpeg was found but GIF generation failed.");
    }
  } else {
    console.log("FFmpeg not found; skipped GIF generation.");
  }
}

capture().catch((error) => {
  console.error("Showcase capture failed:", error?.message || error);
  process.exit(1);
});
