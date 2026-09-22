# 업사이클링 페이지 지도 렌더 소스

`public/up/lab-*.webp`, `public/up/mask_*.png`, `components/up/lab.json`은 이 코드로 직접 만든 등각 장면입니다. 외부 모델 · AI 이미지 없음.
03 재활용 공정 지도(`../rc/plant.py`)와 01 재제조 작업장(`../rm/workshop.py`)의 도형 · 재질 · 조명 · 카메라를 그대로 씁니다.

```bash
pip install bpy==5.0.1 pillow
python render.py w=2800 s=48 out=out      # 장면 + 전환별 마스크 + 좌표 (CPU 2코어 약 20분)
python export.py out ../../public/up ../../components/up/lab.json
```

장면 구성: 입고(폐배터리 · 폐PET · 철 캔) → 해체 · 선별(양극 분말 · 흑연 · 철 케이스) → 전환 다섯 갈래
(에너지 장치용 촉매 · 흐름전지 직접 투입 · PET와 함께 금속-유기 전극 · 흑연+철 케이스 음극 · 광열 촉매로 PET 분해).
설비는 논문 속 실험 장치를 설명용으로 단순화한 것이며 실제 시설과 다릅니다.
