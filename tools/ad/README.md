# 자동화 해체 페이지 '로봇 해체 셀' 장면 렌더 소스

`public/ad/cell-*.webp`, `public/ad/mask_*.png`, `components/ad/cell.json`은 이 코드로 직접 만든 등각 장면입니다. 외부 모델 · AI 이미지 없음.
03 재활용 공정 지도(`../rc/plant.py`)와 01 재제조 작업장(`../rm/workshop.py`)의 도형 · 재질 · 조명 · 카메라를 그대로 씁니다.

```bash
pip install bpy==5.0.1 pillow
python render.py w=2800 s=48 out=out      # 장면 + 단계 마스크 5장 + 좌표 (CPU 2코어 약 7분)
python export.py out ../../public/ad ../../components/ad/cell.json
```

장면 구성: ① 비전 스캔(위 카메라 문 · 화면) → ② 나사 풀기(로봇 팔 A · 공구 거치대) → ③ 사람 협업 구역(라이트 커튼 · 커넥터 분류함 · 상태등)
→ ④ 모듈 꺼내기(로봇 팔 B) → ⑤ 분류 · 반출(컨베이어 · 재제조 파랑 / 재사용 청록 / 재활용 주황 통).
배치와 설비 형태는 연구에 나온 셀들을 한 줄로 단순화한 것이며 실제 설비와 다릅니다.

## 로봇 팔

`cell.arm()`은 6축 팔을 4관절로 단순화했습니다: J1(수직축 회전) → J2 어깨 → J3 팔꿈치 → J4 손목. 관절은 빈 물체(empty)로 묶여 있어 각도만 바꾸면 팔 전체가 따라 움직입니다.
`cell.reach(name, u, v, z)`는 공구 끝을 그 자리에 두는 각도를 두 마디 역기구학으로 풉니다(공구는 늘 수직 아래). `animate.py only=dry`가 모든 프레임에서 공구 끝 오차를 출력합니다.

## 공정 재생 (LED 흐름선 + 설비 동작)

01~06 지도와 같은 공통 도구(`../rc/motion_kit.py` · `../rc/motion_export.py`)를 씁니다.

```bash
python animate.py out=out/anim only=dry                        # 렌더 없이 자세 · 움직이는 범위 · 공구 끝 오차 점검
python animate.py out=out/anim                                 # 흐름선 좌표 · 클린 배경(팔 A · 팔 B+모듈) · 가림 마스크 · 설비 동작 프레임 (CPU 2코어 약 25분)
python ../rc/motion_export.py out/anim out/cell.png ../../public/ad/cell ../../components/ad/motion.json 1750 align=s2
```

- 흐름선은 한 줄: 입구 → ①②③④ → ⑤.
- ② 팔 A가 나사 여섯 개를 차례로 찾아가 풀고(청록 표시) 쉬는 자세로 돌아갑니다. ④ 팔 B가 모듈을 집어 컨베이어에 올리면 모듈이 재사용 통으로 갑니다.
  두 팔과 모듈은 기본 장면에서 지운 클린 배경을 덧붙이고, 멈춰 있을 때는 제자리 모습(rest)을 얹습니다.
- ③ 상태등(주황: 사람 작업 중 · 청록: 완료)과 라이트 커튼, ① 스캔 빛 · 화면, ⑤ 통 표시는 덧그림입니다.
