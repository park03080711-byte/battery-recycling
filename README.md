# RE:CELL 14 — 폐배터리 활용방안 14개 주제

폐배터리 리사이클링 기술 조사 보고서(문헌 35편)를 바탕으로 만든 소개 웹사이트입니다.
메인 풀페이지 스크롤 → 층위 패널 → 주제 카드 → 서브페이지(비주얼 배너 + 브레드크럼 드롭다운) 구조입니다.

- 프레임워크: Next.js 16 (App Router) + TypeScript, 외부 UI 라이브러리 없음
- 모든 일러스트·도식은 SVG 코드로 직접 제작 (외부 사진 없음)
- 폰트: Pretendard (jsDelivr CDN)

## 폴더 구조

```
app/
  page.tsx                 메인 (풀페이지 5섹션 + 푸터)
  topics/page.tsx          14개 주제 한눈에
  topics/[slug]/page.tsx   주제 상세 (14페이지 정적 생성)
  about/page.tsx           사이트 소개
  references/page.tsx      참고문헌 35편 + 정책 자료
  globals.css              디자인 토큰 · 전체 스타일
components/                헤더(메가메뉴), 푸터, SVG 아트, 아이콘, 시각화
data/
  topics.ts                ★ 14개 주제 본문 — 내용 수정은 여기서
  layers.ts                네 층위(경로·지원 기술·평가·설계)와 색
  references.ts            참고문헌 35편
```

본문을 고치고 싶으면 `data/topics.ts`만 수정하면 됩니다. 각 주제는 `sections → blocks` 구조이고,
블록 종류는 `p`(문단) · `list` · `note`(강조 상자) · `steps`(단계) · `table` · `viz`(시각화)입니다.

## 내 컴퓨터에서 실행

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run dev
# http://localhost:3000
```

## 배포 — GitHub + Vercel

### 1. GitHub에 올리기

1. https://github.com/new 에서 새 저장소 생성 (예: `battery-recycling-14`). README 추가는 체크하지 않습니다.
2. 이 폴더에서 터미널을 열고:

```bash
git init            # 이미 .git 폴더가 있으면 생략
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<내아이디>/battery-recycling-14.git
git push -u origin main
```

> 터미널이 익숙하지 않다면 GitHub Desktop 앱으로 이 폴더를 "Add existing repository" 한 뒤 Publish 해도 됩니다.
> 웹에서 직접 올릴 경우 `node_modules`, `.next` 폴더는 올리지 마세요.

### 2. Vercel에 연결

1. https://vercel.com 에 GitHub 계정으로 로그인
2. **Add New… → Project** → 방금 만든 저장소 **Import**
3. Framework Preset이 **Next.js**로 자동 인식되는지 확인 (다른 설정은 그대로)
4. **Deploy** → 1~2분 후 `https://<프로젝트명>.vercel.app` 주소가 생깁니다

이후에는 GitHub에 `git push`할 때마다 Vercel이 자동으로 다시 배포합니다.

### 공개 범위에 관하여

- 검색 노출을 막기 위해 `robots: noindex`를 설정해 두었습니다 (`app/layout.tsx`).
- 링크를 아는 사람만 보게 하려면 Vercel 프로젝트 **Settings → Deployment Protection**에서 보호 옵션을 켤 수 있습니다(요금제별 제공 범위 상이).

## 고지

학생 과제물 · 비영리 교육 목적. 언급된 기업과 관련이 없으며 기업 로고를 사용하지 않았습니다.
기업 발표 수치(회수율 95%, CO₂ 70% 절감)는 자체 발표 기준이고, 정책 수치는 인용 시점에 따라 달라질 수 있습니다.
