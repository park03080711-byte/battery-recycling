# 첫 화면 절개 셀 렌더 소스

`public/hero/cell-*.{avif,webp}`는 이 코드로 직접 만든 21700 원통형 셀(나선형 전극이 보이는 부분 절개)입니다. 외부 모델 · AI 이미지 없음.
재질 도우미는 `../anatomy/scene.py`를 함께 씁니다.

```bash
pip install bpy==5.0.1 pillow
python cyl.py rot=24,14,0 cut=-120 zcut=-0.4 lens=178 camel=9 w=1000 h=1560 s=72 out=cell.png   # CPU 2코어 약 8분
```
렌더 뒤 투명 여백을 잘라 480 · 820px 폭의 AVIF/WebP로 내보냅니다. 층 두께는 보이도록 과장했고, 층 순서(양극 · 분리막 · 음극 · 분리막)와 구조는 실제를 따릅니다.
