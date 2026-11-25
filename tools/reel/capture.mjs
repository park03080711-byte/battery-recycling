// 소개 페이지 영상 — 주제 지도의 '공정 재생'을 실제 사이트 화면 그대로 찍는다 (Playwright).
// 페이지의 requestAnimationFrame · performance.now를 가상 시간으로 바꿔, 한 장 찍을 때마다 정확히 STEP ms만큼만 재생을 진행시킨다.
// 그래서 컴퓨터 속도와 관계없이 같은 프레임이 나온다. STEP 83 = 24fps 영상에서 2배속(83 ms × 24 = 2초 분량/초).
// 사이트를 빌드해 localhost:3100에 띄운 뒤:  node capture.mjs <slug,slug,...> 83 [출력 폴더]
//   → <출력>/<slug>/000.png(재생 전) · 001.png ...
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs';
const slugs = process.argv[2].split(','); const STEP = +(process.argv[3] || 83); const OUT = process.argv[4] || '/tmp/claude-0/reel';
const VIRT = () => {
  let vt = 0, id = 0; const q = new Map();
  performance.now = () => vt;
  window.requestAnimationFrame = (cb) => { q.set(++id, cb); return id; };
  window.cancelAnimationFrame = (i) => q.delete(i);
  window.__step = (ms) => { const end = vt + ms; while (vt < end - 1e-6) { vt = Math.min(end, vt + 1000 / 60); const cbs = [...q.values()]; q.clear(); for (const cb of cbs) cb(vt); } };
};
const b = await chromium.launch();
for (const s of slugs) {
  const dir = `${OUT}/${s}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const c = await b.newContext({ viewport: { width: 1440, height: 1300 }, deviceScaleFactor: 1.25 });
  await c.addInitScript(VIRT);
  const p = await c.newPage();
  await p.goto('http://localhost:3100/topics/' + s, { waitUntil: 'networkidle' });
  const st = p.locator('.rc-map-stage'); await st.scrollIntoViewIfNeeded();
  await p.evaluate(() => { const h = document.querySelector('header'); if (h) h.style.visibility = 'hidden'; });
  await p.waitForTimeout(1500); await p.evaluate(() => window.__step(500));
  await st.screenshot({ path: `${dir}/000.png` });
  await p.getByRole('button', { name: '공정 재생' }).click();
  await p.waitForTimeout(150);
  let k = 1, t = 0;
  for (; t < 120000; t += STEP) {
    await p.evaluate((ms) => window.__step(ms), STEP);
    await p.waitForTimeout(20);
    await st.screenshot({ path: `${dir}/${String(k++).padStart(3, '0')}.png` });
    const txt = await p.locator('.rc-map-play').innerText().catch(() => '');
    if (/다시/.test(txt)) break;
  }
  console.log(s, 'frames', k, 'sim', ((t + STEP) / 1000).toFixed(2), 's');
  await c.close();
}
await b.close();
