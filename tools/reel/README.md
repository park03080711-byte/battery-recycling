# 소개 페이지 영상 1 — 주제별 공정 재생 영상

`public/about/reel/<주제>.mp4`(1280×790, 소리 없음) · `<주제>.webp`(첫 화면 포스터), `components/about/reel.json`(주제별 길이)은 이 코드로 만듭니다.
새로 그린 장면은 없습니다. 각 주제 페이지의 지도와 '공정 재생'을 실제 사이트 화면 그대로 찍었습니다. AI 영상 · 외부 소스 없음.

```bash
npm run build && npx next start -p 3100          # 사이트를 먼저 띄움 (저장소 맨 위에서)
node capture.mjs remanufacturing,reuse,recycling,upcycling,soh-diagnosis,safety,automated-disassembly,byproduct-recovery,traceability,certification,lca,techno-economic,supply-chain,design-for-disassembly 62.5 out
python reel.py out ../../public/about/reel ../../components/about/reel.json
```

- `capture.mjs`: 페이지의 requestAnimationFrame · performance.now를 가상 시간으로 바꿔, 한 장 찍을 때마다 정확히 STEP ms씩만 재생을 진행시킵니다.
  컴퓨터 속도와 관계없이 같은 프레임이 나옵니다. STEP 62.5 = 24fps 영상에서 1.5배속(사이트 공정 재생은 주제마다 약 10~20초). 머리 메뉴는 숨깁니다.
- `reel.py`: 주제마다 한 편 — 재생 전 화면 → 공정 재생 → 끝 화면 0.5초. 비율이 다른 지도(03 재활용은 가로로 김)는 비율을 지키고
  남는 곳은 가장자리 한 줄을 늘여 채웁니다. H.264 CRF 27, faststart. 속도를 바꾸면 `reel.py`의 SPEED도 같이 바꿉니다(캡션에 표시).
- 소개 페이지(`components/about/Reel.tsx`)는 저절로 재생하지 않습니다. 번호로 주제를 고르고 '공정 재생'을 누르면 그 한 편만 받아 한 번 재생합니다.
- 지도나 공정 재생을 고치면 그 주제만 다시 찍고 `reel.py`를 다시 돌리면 됩니다.
