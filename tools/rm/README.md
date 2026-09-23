# 재제조 페이지 작업장 렌더 소스

`public/rm/shop-*.webp`, `public/rm/mask_*.png`, `components/rm/shop.json`은 이 코드로 직접 만든 등각 재제조 작업장 장면입니다. 외부 모델 · AI 이미지 없음.
03 재활용 공정 지도(`../rc/plant.py`)의 도형 · 재질 · 조명 · 카메라를 그대로 씁니다.

```bash
pip install bpy==5.0.1 pillow
python render.py w=2800 s=48 out=out      # 장면 + 단계 마스크 + 좌표 (CPU 2코어 약 20분)
python export.py out ../../public/rm ../../components/rm/shop.json
```
작업장 배치와 설비 형태는 설명용으로 단순화했고 실제 작업장과 다릅니다.

## 공정 재생 (LED 흐름선 + 설비 동작)

```bash
python animate.py out=anim only=coords,plate,occ,clips cs=24   # 흐름선 좌표 · ② 클린 배경 · 가림 마스크 · 설비 동작 프레임 (CPU 2코어 약 10분)
python motion_export.py anim <원본 shop-2800.webp 폴더> ../../public/rm ../../components/rm/motion.json
```

- 카메라는 render.py와 같은 계산으로 원래 장면에 맞춘다(추가 물체가 틀을 바꾸지 않게).
- 설비 동작은 움직이는 물체만 보이고 나머지는 holdout(가림만)으로 렌더해, 앞에 있는 설비에 자연스럽게 가려진다.
- ② 호이스트의 움직이는 부품(`anim="r2"`로 표시)은 배경에서 빼고(클린 배경을 해당 영역에만 덧붙임) 동작 클립이 대신 그린다.
- 결과: `shop-clip-{r1..r4}.webp`(스프라이트), `shop-rest-r2.webp`, `shop-flowmask.png`, `motion.json`.
