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
