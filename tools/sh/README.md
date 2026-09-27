# 잔존수명 진단 페이지 '진단 라인' 장면 렌더 소스

`public/sh/line-*.webp`, `public/sh/mask_*.png`, `components/sh/line.json`은 이 코드로 직접 만든 등각 장면입니다. 외부 모델 · AI 이미지 없음.
03 재활용 공정 지도(`../rc/plant.py`)와 01 재제조 작업장(`../rm/workshop.py`)의 도형 · 재질 · 조명 · 카메라를 그대로 씁니다.

```bash
pip install bpy==5.0.1 pillow
python render.py w=2800 s=48 out=out      # 장면 + 단계 마스크 7장 + 좌표 (CPU 2코어 약 15분)
python export.py out ../../public/sh ../../components/sh/line.json
```

장면 구성: ① 탈거 전 평가(차에 달린 채 진단기 연결) → ② 외관 · 안전 점검(검사 문) → ③ 빠른 진단(측정기 · 모듈 측정선) → ④ 등급 판정(회전대 · 판정 기둥)
→ 세 출구: 재제조(차량 탑재 대기 선반) · 재사용(ESS 캐비닛) · 재활용(수거함 · 톤백).
배치와 설비 형태는 설명용으로 단순화했고 실제 시설과 다릅니다.

## 공정 재생 (LED 흐름선 + 설비 동작, 출구는 한 갈래씩)

01~04 지도와 같은 공통 도구(`../rc/motion_kit.py` · `../rc/motion_export.py`)를 씁니다. 모든 동작이 덧그림(표시등 · 빛 · 떨어지는 모듈)이라 클린 배경은 없습니다.

```bash
python animate.py out=anim only=dry                           # 렌더 없이 모든 프레임의 자세 함수 점검
python animate.py out=anim                                    # 흐름선 좌표 · 가림 마스크 · 설비 동작 프레임 (CPU 2코어 약 12분)
python ../rc/motion_export.py anim <원본 line-2800.webp> ../../public/sh/line ../../components/sh/motion.json
```

- 흐름선은 경로 넷: 입구 → ①②③④ → 갈림점, 그리고 갈림점 → 재제조 · 재사용 · 재활용.
- 페이지에서는 지도 아래 잔존용량 슬라이더가 해당 출구를 골라 지도에서 밝혀 줍니다(`SystemMap`의 `select` 속성).
