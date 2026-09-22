# 재제조 페이지 작업장 렌더 소스

`public/rm/shop-*.webp`, `public/rm/mask_*.png`, `components/rm/shop.json`은 이 코드로 직접 만든 등각 재제조 작업장 장면입니다. 외부 모델 · AI 이미지 없음.
03 재활용 공정 지도(`../rc/plant.py`)의 도형 · 재질 · 조명 · 카메라를 그대로 씁니다.

```bash
pip install bpy==5.0.1 pillow
python render.py w=2800 s=48 out=out      # 장면 + 단계 마스크 + 좌표 (CPU 2코어 약 20분)
python export.py out ../../public/rm ../../components/rm/shop.json
```
작업장 배치와 설비 형태는 설명용으로 단순화했고 실제 작업장과 다릅니다.
