#!/usr/bin/env node
import { spawn } from "node:child_process";

const PORT = 8094;
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

  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const sender = await context.newPage();
    const receiver = await context.newPage();

    await sender.goto(URL, { waitUntil: "domcontentloaded" });
    await receiver.goto(URL, { waitUntil: "domcontentloaded" });

    await sender.click("#mode-sender");
    await receiver.click("#mode-receiver");

    await sender.click("#connection-manual");
    await receiver.click("#connection-manual");

    await sender.click("#manual-create-offer");
    await sender.waitForFunction(
      () => document.querySelector("#manual-offer-output")?.value.startsWith("0XL1."),
      null,
      { timeout: 15_000 }
    );
    const offer = await sender.locator("#manual-offer-output").inputValue();

    await receiver.fill("#manual-offer-input", offer);
    await receiver.click("#manual-accept-offer");
    await receiver.waitForFunction(
      () => document.querySelector("#manual-answer-output")?.value.startsWith("0XL1."),
      null,
      { timeout: 15_000 }
    );
    const answer = await receiver.locator("#manual-answer-output").inputValue();

    await sender.fill("#manual-answer-input", answer);
    await sender.click("#manual-accept-answer");
    await sender.waitForFunction(() => document.querySelector("#dc-state")?.textContent === "open", null, { timeout: 20_000 });
    await receiver.waitForFunction(() => document.querySelector("#dc-state")?.textContent === "open", null, { timeout: 20_000 });

    await sender.setInputFiles("#file-input", {
      name: "manual.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("0xLynk manual transfer smoke\n".repeat(512))
    });
    await sender.click("#start-transfer");

    await sender.waitForFunction(() => document.querySelector("#transfer-state")?.textContent === "completed", null, { timeout: 30_000 });
    await receiver.waitForFunction(() => document.querySelector("#transfer-state")?.textContent === "completed", null, { timeout: 30_000 });

    const incomingText = await receiver.locator("#incoming-list").textContent();
    if (!incomingText || !incomingText.includes("manual.txt") || !incomingText.includes("verified")) {
      throw new Error("manual_transfer_not_verified");
    }

    console.log("MANUAL P2P SMOKE PASS");
  } finally {
    if (browser) {
      await browser.close();
    }
    server.kill("SIGTERM");
  }
}

run().catch((error) => {
  console.error("MANUAL P2P SMOKE FAIL", error?.message || error);
  process.exit(1);
});
