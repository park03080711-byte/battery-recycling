# 재활용 페이지 공정 지도 렌더 소스

`public/rc/plant-*.webp`, `public/rc/mask_*.png`, `components/rc/plant.json`은 이 코드로 직접 만든 등각(아이소메트릭) 공정 장면입니다. 외부 모델 · AI 이미지 없음.
재질 · 도형 도우미는 `../anatomy/scene.py`를 함께 씁니다.

```bash
pip install bpy==5.0.1 pillow
python render.py w=2800 s=48 out=out      # 장면 + 단계 마스크 7장 + 좌표 (CPU 2코어 약 10분)
python export.py out ../../public/rc ../../components/rc/plant.json
```
정투영 카메라를 등각 각도(35.264° / 45°)에 두고 투명 배경 + 그림자 받이로 렌더해 페이지 바탕(#F3F7FF)에 얹습니다.
설비 형태는 설명용으로 단순화했고 실제 설비 배치와 다릅니다.

## 공정 재생 (LED 흐름선 + 설비 동작 + 트럭 이동)

01 재제조 · 02 재사용 지도와 같은 공통 도구(`motion_kit.py` · `motion_export.py`)를 쓴다.

```bash
python animate.py out=anim                                   # 흐름선 좌표 · 클린 배경(트럭 · ④ 교반 날개) · 가림 마스크 · 설비 동작 프레임
python motion_export.py anim <원본 plant-2800.webp> ../../public/rc/plant ../../components/rc/motion.json 1750 align=h1
```

- 흐름선은 한 줄: 해외 거점 바닥 → ①②③ → 도로 → 국내 거점 배관(④ → ⑤ → ⑥ → ⑦).
- 트럭(`anim="tr"`)은 배경에서 빼고 클립이 그린다. 클립의 `carry` 구간 동안 빛 점이 트럭과 함께 도로를 달린다.
- 트럭이 움직이는 클립은 맞춤 기준으로 쓸 수 없어서, 자세가 바뀌지 않는 ④ 정지 클립으로 위치를 맞춘다(`align=h1`).
- ④ 교반 날개(`anim="h1"`)도 배경에서 빼고 클립이 돌린다.
