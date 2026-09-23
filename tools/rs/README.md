# 재사용 페이지 '두 번째 삶' 장면 렌더 소스

`public/rs/yard-*.webp`, `public/rs/mask_*.png`, `components/rs/yard.json`은 이 코드로 직접 만든 등각 장면입니다. 외부 모델 · AI 이미지 없음.
03 재활용 공정 지도(`../rc/plant.py`)와 01 재제조 작업장(`../rm/workshop.py`)의 도형 · 재질 · 조명 · 카메라를 그대로 씁니다.

```bash
pip install bpy==5.0.1 pillow
python render.py w=2800 s=48 out=out      # 장면 + 단계 마스크 + 좌표 (CPU 2코어 약 20분)
python export.py out ../../public/rs ../../components/rs/yard.json
```

장면 구성: 입고(전기차) → 등급 판정 → 재포장 → 활용처 넷(ESS 컨테이너 · 가정 · 충전소 / UPS / 태양광 가로등 / 소형 모빌리티).
배치와 설비 형태는 설명용으로 단순화했고 실제 시설과 다릅니다.

## 공정 재생 (LED 흐름선 + 설비 동작, 갈래는 한 갈래씩)

공통 도구 `../rc/motion_kit.py`(Blender)와 `../rc/motion_export.py`(내보내기)를 쓴다. 01 재제조에서 만든 방식을 정리한 것.

```bash
python animate.py out=anim                                   # 흐름선 좌표 · ② 클린 배경 · 가림 마스크 · 설비 동작 프레임 (CPU 2코어 약 12분)
python ../rc/motion_export.py anim <원본 yard-2800.webp> ../../public/rs/yard ../../components/rs/motion.json
```

- 흐름선은 경로 다섯 개: 입구 → ① → ② → 갈림점, 그리고 갈림점 → ESS · UPS · 가로등 · 소형 모빌리티.
- ③ ESS는 컨테이너(d1)와 충전소(d1b) 두 곳이 함께 움직인다(`step`으로 같은 단계에 묶음).
- ② 재포장에서 옮겨지는 모듈(`anim="s2"`)은 배경에서 빼고 클립이 대신 그린다.
