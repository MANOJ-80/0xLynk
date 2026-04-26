#!/usr/bin/env node
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const PORT = 8093;
const URL = `http://127.0.0.1:${PORT}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const response = await fetch(`${URL}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await wait(250);
  }
  throw new Error("server_start_timeout");
}

async function run() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("Playwright is required. Run npm install first.");
    process.exit(1);
  }

  const server = spawn("node", ["apps/signaling-server/src/server.js"], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd()
  });
  server.stdout.pipe(process.stdout);
  server.stderr.pipe(process.stderr);

  const tempDir = await mkdtemp(join(tmpdir(), "0xlynk-transfer-"));
  const filePath = join(tempDir, "sample.txt");
  await writeFile(filePath, "0xLynk browser transfer smoke\n".repeat(1024));

  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const sender = await context.newPage();
    const receiver = await context.newPage();

    await sender.goto(URL, { waitUntil: "networkidle" });
    await receiver.goto(URL, { waitUntil: "networkidle" });

    await sender.click("#create-session");
    await sender.waitForFunction(() => /^\d{6}$/.test(document.querySelector("#room-code")?.textContent?.replace(/\D/g, "") || ""));
    const code = await sender.locator("#room-code").textContent();
    const normalizedCode = String(code || "").replace(/\D/g, "");

    await receiver.click("#mode-receiver");
    await receiver.fill("#join-code", normalizedCode);
    await receiver.click("#join-session");

    await sender.waitForFunction(() => document.querySelector("#dc-state")?.textContent === "open", null, { timeout: 20_000 });
    await receiver.waitForFunction(() => document.querySelector("#dc-state")?.textContent === "open", null, { timeout: 20_000 });

    await sender.setInputFiles("#file-input", filePath);
    await sender.click("#start-transfer");

    await sender.waitForFunction(() => document.querySelector("#transfer-state")?.textContent === "completed", null, { timeout: 30_000 });
    await receiver.waitForFunction(() => document.querySelector("#transfer-state")?.textContent === "completed", null, { timeout: 30_000 });

    const incomingText = await receiver.locator("#incoming-list").textContent();
    if (!incomingText || !incomingText.includes("sample.txt") || !incomingText.includes("verified")) {
      throw new Error("incoming_file_not_verified");
    }

    console.log("BROWSER TRANSFER SMOKE PASS");
  } finally {
    if (browser) {
      await browser.close();
    }
    server.kill("SIGTERM");
    await rm(tempDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error("BROWSER TRANSFER SMOKE FAIL", error?.message || error);
  process.exit(1);
});
