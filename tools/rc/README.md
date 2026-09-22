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
