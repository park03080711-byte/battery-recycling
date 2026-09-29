# 안전 관리 페이지 '안전 동선' 장면 렌더 소스

`public/sf/site-*.webp`, `public/sf/mask_*.png`, `components/sf/depot.json`은 이 코드로 직접 만든 등각 장면입니다. 외부 모델 · AI 이미지 없음.
03 재활용 공정 지도(`../rc/plant.py`)와 01 재제조 작업장(`../rm/workshop.py`)의 도형 · 재질 · 조명 · 카메라를 그대로 씁니다.
(장면 파일 이름이 `depot.py`인 것은 파이썬 표준 모듈 `site`와 겹치지 않게 하려는 것입니다.)

```bash
pip install bpy==5.0.1 pillow
python render.py w=2800 s=48 out=out      # 장면 + 단계 마스크 5장 + 좌표 (CPU 2코어 약 12분)
python export.py out ../../public/sf ../../components/sf/depot.json
```

장면 구성: ① 입고 · 격리 검사(열화상 기둥 · 모래 격리함) → ② 방전(방전 캐비닛 · 케이블) → ③ 전압 반등 확인(대기 선반 · 측정 화면)
→ ④ 안전 보관(방화벽 칸 · 소화 배관 · 모래 함) → ⑤ 운송 포장(전용 용기 · 트럭).
배치와 설비 형태는 설명용으로 단순화했고 실제 시설과 다릅니다.

## 공정 재생 (LED 흐름선 + 설비 동작)

01~05 지도와 같은 공통 도구(`../rc/motion_kit.py` · `../rc/motion_export.py`)를 씁니다. 모든 동작이 덧그림(표시등 · 빛)이라 클린 배경은 없습니다.

```bash
python animate.py out=anim only=dry                           # 렌더 없이 모든 프레임의 자세 함수 점검
python animate.py out=anim                                    # 흐름선 좌표 · 가림 마스크 · 설비 동작 프레임 (CPU 2코어 약 10분)
python ../rc/motion_export.py anim <원본 site-2800.webp> ../../public/sf/site ../../components/sf/motion.json
```

- 흐름선은 한 줄: 입구 → ①②③④ → ⑤. 손상 팩이 주황 점선을 따라 격리함으로 빠지는 모습은 ① 클립이 그립니다.
- ③ 화면 막대가 기준선 아래로 내려갔다가 다시 올라오는 것은 전압 반등(논문 57번)을 설명용으로 그린 것입니다.
