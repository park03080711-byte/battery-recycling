# 이력관리 페이지 '기록이 모이는 길' 장면 렌더 소스

`public/tr/map-*.webp`, `public/tr/mask_*.png`, `components/tr/map.json`은 이 코드로 직접 만든 등각 장면입니다. 외부 모델 · AI 이미지 없음.
03 재활용 공정 지도(`../rc/plant.py`) · 01 재제조 작업장(`../rm/workshop.py`)의 도형 · 재질 · 조명 · 카메라를 그대로 씁니다.

```bash
pip install bpy pillow            # bpy 5.1에서 확인
python render.py w=2800 s=48 out=out      # 장면 + 단계 마스크 6장 + 좌표 (CPU 2코어 약 15분)
python export.py out ../../public/tr ../../components/tr/map.json
```

장면 구성(장면 파일 `passport.py`): 배터리가 지나는 길(청록) 위에 ① 제조(컨베이어 · 레이저 각인 아치 · 식별 무늬가 붙은 팩)
→ ② 차량 등록(전기차 · 등록 창구) → ③ 운행 · 정비 · 검사(리프트 · 진단 카트) → ④ 탈거 · 성능평가(시험대 · 시험기)
→ 갈림점 → ⑤ 재사용(ESS 캐비닛 · 새 식별 무늬) / ⑥ 재활용(수거함 · 회수 소재 자루).
장소마다 '기록 기둥'이 있고, 파란 점선(데이터 선)이 가운데 뒤의 '배터리 여권 서버'로 모입니다.
재활용 뒤에는 분홍 점선이 판 앞 가장자리를 따라 ① 입구로 돌아갑니다(재생원료 기록이 새 셀로).
식별 무늬는 QR 모양을 흉내 낸 무작위 무늬이며 실제 코드가 아닙니다. 배치는 설명용으로 단순화했고 실제 시스템과 다릅니다.

## 공정 재생 (LED 흐름선 + 기록 동작)

01~08 지도와 같은 공통 도구(`../rc/motion_kit.py` · `../rc/motion_export.py`)를 씁니다. 모든 동작이 덧그림이라 클린 배경은 없습니다.

```bash
python animate.py out=out/anim only=dry                       # 렌더 없이 자세 · 움직이는 범위 점검
python animate.py out=out/anim                                # 흐름선 좌표 · 가림 마스크 · 동작 프레임 (CPU 2코어 약 25분)
python ../rc/motion_export.py out/anim out/trace.png ../../public/tr/map ../../components/tr/motion.json
```

- 흐름선: 입구 → ①②③④ → 갈림점 → ⑤ 재사용 / ⑥ 재활용 → (분홍 길을 따라) ① 입구.
- 장소마다 그 자리의 기록이 생기고(레이저 각인 · 등록 화면 · SOH 막대 · 시험기 등 · 충전 표시 · 소재 기록표),
  기록 기둥을 따라 빛 고리가 올라간 뒤 꼭대기 등이 켜집니다.
- 같은 순간 가운데 서버 위 받침에 그 단계 색의 '여권 한 장'(클립 `p_*`)이 내려앉습니다. 끝난 장은 남아 있어 차례로 쌓입니다.
