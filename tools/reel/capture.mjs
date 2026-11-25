// 소개 페이지 영상 1 — 주제 지도의 '공정 재생'을 실제 사이트 화면 그대로 찍는다 (Playwright).
// 가짜 시계(page.clock)로 시간을 STEP ms씩 넘기며 지도 무대만 찍으므로 컴퓨터 속도와 관계없이 같은 프레임이 나온다.
// STEP 208 = 24fps 영상에서 5배속. 사이트를 빌드해 localhost:3100에 띄운 뒤:
// node capture.mjs remanufacturing,reuse,...  208      → /tmp/claude-0/reel/<slug>/000.png(재생 전) · 001.png ...
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs';
const slugs = process.argv[2].split(','); const STEP = +(process.argv[3] || 250);
const b = await chromium.launch();
for (const s of slugs) {
  const dir = `/tmp/claude-0/reel/${s}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const c = await b.newContext({ viewport: { width: 1440, height: 1300 }, deviceScaleFactor: 1.25 });
  const p = await c.newPage();
  await p.clock.install();
  await p.goto('http://localhost:3100/topics/' + s, { waitUntil: 'networkidle' });
  await p.clock.runFor(1500);
  const st = p.locator('.rc-map-stage'); await st.scrollIntoViewIfNeeded();
  await p.evaluate(() => { const h = document.querySelector('header'); if (h) h.style.visibility = 'hidden'; });
  await p.clock.runFor(800);
  await st.screenshot({ path: `${dir}/000.png` });
  await p.getByRole('button', { name: '공정 재생' }).click();
  let k = 1, t = 0;
  for (; t < 90000; t += STEP) {
    await p.clock.runFor(STEP);
    await st.screenshot({ path: `${dir}/${String(k++).padStart(3, '0')}.png` });
    const txt = await p.locator('.rc-map-play').innerText().catch(() => '');
    if (/다시/.test(txt)) break;
  }
  console.log(s, 'frames', k, 'dur', (t + STEP) / 1000);
  await c.close();
}
await b.close();
