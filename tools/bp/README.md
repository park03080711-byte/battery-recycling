# 부산물 회수 페이지 '부산물 회수 라인' 장면 렌더 소스

`public/bp/line-*.webp`, `public/bp/mask_*.png`, `components/bp/line.json`은 이 코드로 직접 만든 등각 장면입니다. 외부 모델 · AI 이미지 없음.
03 재활용 공정 지도(`../rc/plant.py`)와 01 재제조 작업장(`../rm/workshop.py`)의 도형 · 재질 · 조명 · 카메라를 그대로 씁니다.

```bash
pip install bpy==5.0.1 pillow
python render.py w=2800 s=48 out=out      # 장면 + 단계 마스크 5장 + 좌표 (CPU 2코어 약 8분)
python export.py out ../../public/bp ../../components/bp/line.json
```

장면 구성: ① 전해액 회수(CO₂ 용기 · 펌프 · 추출 용기 · 분리기 · 받는 통) → ② 파쇄 · 선별(파쇄기 · 진동 체 · 포일 스크랩 통 · 블랙파우더 통)
→ ③ 리튬 먼저(COOL: CO₂ 용기 · 가로 오토클레이브 · 압력계 · 탄산리튬 쟁반) → ④ 니켈 · 코발트 · 망간 침출(침출조 두 개 · 03 재활용으로 가는 배관)
→ ⑤ 흑연 재생(산 세척조 · 저온 열분해로 · 배기 처리탑 · 재생 흑연 통).
여러 논문의 방법을 한 줄로 이어 단순화한 배치이며 실제 설비와 다릅니다.

## 공정 재생 (LED 흐름선 + 설비 동작)

01~07 지도와 같은 공통 도구(`../rc/motion_kit.py` · `../rc/motion_export.py`)를 씁니다. 모든 동작이 덧그림(빛 · 액체 · 가루 · 조각)이라 클린 배경은 없습니다.

```bash
python animate.py out=out/anim only=dry                       # 렌더 없이 자세 · 움직이는 범위 점검
python animate.py out=out/anim                                # 흐름선 좌표 · 가림 마스크 · 설비 동작 프레임 (CPU 2코어 약 20분)
python ../rc/motion_export.py out/anim out/line.png ../../public/bp/line ../../components/bp/motion.json
```

- 흐름선은 한 줄: 입구 → ①②③④⑤.
- ① CO₂(파랑)가 추출 용기로 들어가고, 분리기에서 CO₂가 날아가며 받는 통에 호박색 전해액이 찹니다.
- ③ 압력계가 주황으로 깜빡인 뒤(250 ℃ · 100 bar를 뜻함, 논문 31번) 흰 탄산리튬이 쟁반에 쌓입니다.
- ⑤ 열분해로 창이 달아오르고 배기 처리탑 위로 김이 오릅니다(바인더 분해 가스 처리).
