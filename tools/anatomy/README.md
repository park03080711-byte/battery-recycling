# 배터리팩 해부도 렌더 소스

`public/anatomy/`의 이미지는 모두 이 폴더의 코드로 직접 만든 것입니다 (외부 3D 모델 · AI 이미지 없음).

- `textures.py` — PCB 배선, 고전압 경고 라벨, 명판 텍스처를 Pillow로 그림
- `scene.py` — 파우치형 셀 배터리팩(트레이 · 냉각판 · 모듈 7개 + 빈 자리 · BMS · 차단 장치 · 덮개)과 셀 분해도를 Blender Python(bpy)으로 절차적 모델링
- `render_all.py` — Cycles로 전체(닫힘/열림) · 부위 마스크 · 상세 4장을 렌더하고, 3D 기준점을 화면 좌표(%)로 투영해 `coords.json` 저장
- `export.py` — PNG를 웹용 webp(1920/1200)와 마스크 PNG로 변환

```bash
pip install bpy==5.0.1 pillow
python textures.py
python render_all.py w=1920 h=1080 s=64      # CPU 2코어 기준 장당 약 7분
python export.py final ../../public/anatomy
cp final/coords.json ../../data/anatomy-coords.json
```
