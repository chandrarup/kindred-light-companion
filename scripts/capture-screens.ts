/**
 * Developer screenshot tool — design review only.
 * Usage: npm run capture   (dev server must be running on BASE_URL, default http://localhost:8080)
 *
 * Writes PNGs into design-review/screenshots/ across:
 *   route × {desktop 1440x900, mobile 390x844} × {en, es} × {light, dark}
 *
 * Full-page screenshots are capped at MAX_FULLPAGE_H pixels tall so individual
 * PNGs stay under the repo's 10 MB per-file commit limit.
 */
import { chromium, devices, type Browser, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:8080";
const OUT = "design-review/screenshots";
const MAX_FULLPAGE_H = 4000;

type Lang = "en" | "es";
type Theme = "light" | "dark";
type Surface = "desktop" | "mobile";

const VIEWPORTS: Record<Surface, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const ROUTES: { name: string; path: string; auth: boolean; fullPage?: boolean }[] = [
  { name: "landing", path: "/", auth: false },
  { name: "auth", path: "/auth", auth: false },
  { name: "admin", path: "/admin", auth: false },
  { name: "patient-home", path: "/patient", auth: true, fullPage: true },
  { name: "caregiver-today", path: "/today", auth: true, fullPage: true },
  { name: "caregiver-photos", path: "/photos", auth: true, fullPage: true },
  { name: "caregiver-learn", path: "/learn", auth: true, fullPage: true },
  { name: "caregiver-circle", path: "/circle", auth: true, fullPage: true },
  { name: "caregiver-cues", path: "/cues", auth: true, fullPage: true },
  { name: "caregiver-summary", path: "/summary", auth: true, fullPage: true },
  { name: "caregiver-settings", path: "/settings", auth: true, fullPage: true },
  { name: "caregiver-profile", path: "/profile", auth: true, fullPage: true },
  { name: "caregiver-onboarding", path: "/onboarding", auth: true, fullPage: true },
];

async function ensureSeeded(page: Page) {
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  const btn = page.getByRole("button", { name: /load|seed|demo/i }).first();
  await btn.waitFor({ state: "visible", timeout: 15_000 });
  await btn.click();
  await page.waitForURL(/\/today/, { timeout: 60_000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function applyPrefs(page: Page, lang: Lang, theme: Theme) {
  await page.addInitScript(({ lang, theme }) => {
    try {
      localStorage.setItem("companion.lang", lang);
      if (theme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}
  }, { lang, theme });
}

async function setRuntimePrefs(page: Page, lang: Lang, theme: Theme) {
  await page.evaluate(({ lang, theme }) => {
    try {
      localStorage.setItem("companion.lang", lang);
      document.documentElement.lang = lang;
      if (theme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}
  }, { lang, theme });
}

async function snap(browser: Browser, route: typeof ROUTES[number], surface: Surface, lang: Lang, theme: Theme, storageState: any) {
  const ctx = await browser.newContext({
    ...(surface === "mobile" ? devices["iPhone 13"] : {}),
    viewport: VIEWPORTS[surface],
    deviceScaleFactor: 1, // keep file sizes reasonable
    storageState: route.auth ? storageState : undefined,
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  await applyPrefs(page, lang, theme);
  await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 30_000 }).catch(() =>
    page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => {}),
  );
  await setRuntimePrefs(page, lang, theme);
  await page.waitForTimeout(700);

  const filename = `${route.name}-${surface}-${lang}-${theme}.png`;
  const path = join(OUT, filename);
  if (route.fullPage) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const clipH = Math.min(h, MAX_FULLPAGE_H);
    await page.screenshot({ path, clip: { x: 0, y: 0, width: VIEWPORTS[surface].width, height: clipH } });
  } else {
    await page.screenshot({ path });
  }
  await ctx.close();
  return filename;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const authCtx = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const authPage = await authCtx.newPage();
  await ensureSeeded(authPage);
  const storageState = await authCtx.storageState();
  await authCtx.close();

  const saved: string[] = [];
  for (const route of ROUTES) {
    for (const surface of ["desktop", "mobile"] as Surface[]) {
      for (const lang of ["en", "es"] as Lang[]) {
        for (const theme of ["light", "dark"] as Theme[]) {
          process.stdout.write(`  ${route.name} ${surface}/${lang}/${theme}… `);
          try {
            saved.push(await snap(browser, route, surface, lang, theme, storageState));
            console.log("✓");
          } catch (e: any) {
            console.log(`✗ ${e?.message ?? e}`);
          }
        }
      }
    }
  }
  await browser.close();
  saved.sort();
  await writeFile(join(OUT, "_manifest.txt"), saved.join("\n") + "\n", "utf8");
  console.log(`\nSaved ${saved.length} screenshots to ${OUT}/`);
  for (const f of saved) console.log("  " + f);
}
main().catch((e) => { console.error(e); process.exit(1); });
