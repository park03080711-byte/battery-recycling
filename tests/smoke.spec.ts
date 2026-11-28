import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { ENVS, PARTS } from "../components/lab/sim/catalog";

/* 주요 페이지: 열리고, 제목이 있고, 콘솔 오류가 없고, 모바일에서 가로로 넘치지 않는다 */
const pages = [
  "/",
  "/about",
  "/anatomy",
  "/topics",
  "/topics/reuse",
  "/references",
  "/lab",
  "/lab/ess-monitoring",
  "/lab/virtual-esp32",
  "/lab/control-room",
];

for (const path of pages) {
  test(`${path} 열림`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    const res = await page.goto(path, { waitUntil: "load" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "가로 넘침(px)").toBeLessThanOrEqual(0);
    expect(errors, "콘솔 오류").toEqual([]);
  });
}

test("없는 주소는 404 페이지", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("페이지를 찾을 수 없습니다");
  await expect(page.getByRole("link", { name: /실험실/ }).first()).toBeVisible();
});

test("파비콘과 아이콘", async ({ request }) => {
  for (const p of ["/favicon.ico", "/icon.svg", "/apple-icon.png"]) {
    expect((await request.get(p)).status(), p).toBe(200);
  }
});

test("글꼴을 사이트에서 직접 제공", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (/\.(woff2?|ttf|otf)(\?|$)/.test(r.url()) && !r.url().startsWith(page.url().split("/").slice(0, 3).join("/"))) external.push(r.url());
  });
  await page.goto("/topics");
  await page.evaluate(() => document.fonts.ready);
  expect(external).toEqual([]);
  expect(await page.evaluate(() => document.fonts.check('16px "Pretendard Variable"', "가"))).toBe(true);
});

/* 공유 이미지 설명은 정적 파일이라 숫자가 목록과 어긋나기 쉽다 — 목록(catalog)과 맞는지 확인 */
test("LAB 02 공유 이미지 설명의 숫자가 부품 목록과 같다", () => {
  const alt = readFileSync("app/lab/virtual-esp32/opengraph-image.alt.txt", "utf8");
  const kit = PARTS.filter((p) => p.group === "kit").length;
  const core = PARTS.filter((p) => p.group === "core").length;
  expect(alt).toContain(`부품 ${PARTS.length}종`);
  expect(alt).toContain(`센서 키트 ${kit}종`);
  expect(alt).toContain(`실측 부품 ${core}종`);
  expect(alt).toContain(`환경 ${ENVS.length}가지`);
});

test("관제실: 첫 진입은 재생 버튼, 끊김으로 이동하면 끊김 경보", async ({ page }) => {
  await page.goto("/lab/control-room");
  const go = page.getByRole("button", { name: /재생 시작/ });
  await expect(go).toBeVisible();
  await expect(page.locator(".cr-body")).toHaveAttribute("inert", "");
  await page.getByRole("button", { name: "Wi-Fi 끊김" }).click();
  await expect(go).toBeHidden();
  await expect(page.locator(".cr-pill")).toContainText("통신 끊김", { timeout: 4000 });
  await expect(page.locator(".cr-alert")).toBeVisible();
  await page.getByRole("button", { name: "일시정지" }).click();
  await expect(page.getByRole("button", { name: "재생", exact: true })).toBeVisible();
});
