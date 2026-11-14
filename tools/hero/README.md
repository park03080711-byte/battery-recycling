# 첫 화면 렌더 소스

외부 모델 · AI 이미지 없이 Blender(bpy)를 파이썬 코드로 움직여 직접 만든 장면입니다.
재질 · 도형 도우미는 `../anatomy/scene.py`를 함께 씁니다.

## 배터리의 일생 영상 (`life.py`) — 지금 첫 화면에 쓰는 것

`public/hero/life.mp4`, `public/hero/life-*.{avif,webp}`

15초 반복 영상입니다. 새 셀 → 모듈 · 팩 조립 → 전기차 탑재 · 주행 → 탈거 · 진단 → 쓸 만한 모듈은 ESS로 재사용 →
약한 모듈은 해체 · 파쇄(블랙매스) → 황산니켈 · 황산코발트 · 황산망간 · 탄산리튬 회수 → 다시 새 셀.

```bash
pip install bpy pillow numpy          # bpy 5.1 에서 확인
python life.py t=0,3,6 w=540 s=24 out=out/still          # 원하는 시각(초)의 정지컷
python life.py frames=0-359 w=540 s=20 out=out/f          # 전체 360프레임 (24fps · CPU 2코어 약 80분)
python life.py t=0 w=1080 s=64 out=out/poster             # 정지 그림(첫 장면)
python pack_video.py out out/poster_00.00.png ../../public/hero
```

- 단계 시각은 `life.py`의 `STAGES`(0 · 2.6 · 5.0 · 7.4 · 9.8 · 12.4초)이고, `app/page.tsx`의 단계 칩 시각과 같아야 합니다.
- 투명 배경이 필요해서 `pack_video.py`가 한 파일 안에 위쪽 절반 = 색, 아래쪽 절반 = 투명도를 쌓습니다.
  브라우저에서는 `components/home/HeroLife.tsx`가 WebGL로 둘을 합쳐 그립니다.
- 크기와 비례는 탁상 모형 축척으로 단순화했습니다(셀 24개짜리 모듈 4개 = 팩). 실제 팩은 셀 수가 훨씬 많고 납작합니다.
  공정 순서와 회수 소재 4종은 03 재활용 페이지의 내용을 따릅니다.

## 절개 셀 정지 그림 (`cyl.py`) — 이전 첫 화면

`public/hero/cell-*.{avif,webp}`는 21700 원통형 셀(나선형 전극이 보이는 부분 절개)입니다. 지금은 영상의 첫 장면이 같은 셀을 보여 줍니다.

```bash
python cyl.py rot=24,14,0 cut=-120 zcut=-0.4 lens=178 camel=9 w=1000 h=1560 s=72 out=cell.png   # CPU 2코어 약 8분
```
층 두께는 보이도록 과장했고, 층 순서(양극 · 분리막 · 음극 · 분리막)와 구조는 실제를 따릅니다.
