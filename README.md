# project17 — 청년 AI 리터러시 진단

AI Reboot Academy 팀 프로젝트 · 최윤경

자가진단으로 청년의 AI 리터러시 격차를 측정하고, 집단(전공·경험) 기준선과 비교해 정책·교육 수요를 예측하는 모델입니다.

배포: https://aebonlee.github.io/project17/  ·  스택: Vite + React 18 + TypeScript (Supabase·OpenAI 선택)

## 시작하기
```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 → http://localhost:5173
npm run build    # 프로덕션 빌드
```

## 폴더
- `src/App.tsx` — 앱 본체(메타 + 기능)
- `src/ui.tsx` — 공통 레이아웃(히어로·탭·정보/팀 탭)
- `src/lib/ai.ts` — OpenAI 호출 헬퍼(키는 사용자가 입력, 선택)
- `src/lib/supabase.ts` — Supabase 클라이언트(선택)

## 배포 (GitHub Pages)
- `main`에 push하면 GitHub Actions가 자동 빌드·배포합니다. (Settings → Pages → GitHub Actions)
- 또는 로컬에서 `npm run deploy`
