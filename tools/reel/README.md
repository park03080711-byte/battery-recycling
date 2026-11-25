# 소개 페이지 영상 1 — 14개 지도 몽타주

`public/about/reel.mp4`(약 28초, 1280×790, 소리 없음), `public/about/reel-poster.webp`, `components/about/reel.json`(주제별 시작 시각)은 이 코드로 만듭니다.
새로 그린 장면은 없습니다. 각 주제 페이지의 지도와 '공정 재생'을 실제 사이트 화면 그대로 찍어 이었습니다. AI 영상 · 외부 소스 없음.

```bash
npm run build && npx next start -p 3100          # 사이트를 먼저 띄움 (저장소 맨 위에서)
node capture.mjs remanufacturing,reuse,recycling,upcycling,soh-diagnosis,safety,automated-disassembly,byproduct-recovery,traceability,certification,lca,techno-economic,supply-chain,design-for-disassembly 208
python reel.py /tmp/claude-0/reel ../../public/about ../../components/about/reel.json
```

- `capture.mjs`: Playwright 가짜 시계로 208 ms씩 넘기며 지도 무대(`.rc-map-stage`)만 찍습니다(24fps 영상에서 5배속). 머리 메뉴는 숨깁니다.
- `reel.py`: 주제마다 재생 전 화면 0.33초 → 공정 재생 → 끝 화면 0.17초 → 다음 주제로 0.25초 겹쳐 넘김. 마지막 주제는 첫 주제로 넘어가 반복이 이어집니다.
  비율이 다른 지도(03 재활용은 가로로 김)는 비율을 지키고 남는 곳을 지도 바탕색으로 채웁니다. H.264 CRF 27, faststart.
- 지도나 공정 재생을 고치면 그 주제만 다시 찍고 `reel.py`를 다시 돌리면 됩니다. `reel.json`의 시작 시각도 함께 바뀝니다.
