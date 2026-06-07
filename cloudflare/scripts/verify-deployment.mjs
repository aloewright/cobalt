#!/usr/bin/env node
/**
 * Capture deployment verification screenshots with Playwright.
 * Usage: node cloudflare/scripts/verify-deployment.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = new URL("../.verify-screenshots/", import.meta.url).pathname;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto("https://cobalt-web.lazee.workers.dev/", {
  waitUntil: "networkidle",
  timeout: 30000,
});
await page.screenshot({
  path: `${OUT}/cobalt-web-access-redirect.png`,
  fullPage: true,
});

await page.goto("https://txt.fly.pm/api/health", { waitUntil: "networkidle" });
await page.screenshot({
  path: `${OUT}/sidebar-api-health.png`,
  fullPage: true,
});

await browser.close();
console.log(`Screenshots saved to ${OUT}`);
