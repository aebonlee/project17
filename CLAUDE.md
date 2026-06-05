# CLAUDE.md — 바이브코딩 가이드 (project17 · 청년 AI 리터러시 진단)

이 저장소는 Claude Code 등 AI 코딩 도구로 개발하기 좋게 구성돼 있습니다.

## 스택
- Vite + React 18 + TypeScript, 공통 UI(`src/ui.tsx`) + 기능(`src/App.tsx`)
- OpenAI(선택): `src/lib/ai.ts` — 키 없으면 오프라인 폴백으로 동작
- Supabase(선택): `src/lib/supabase.ts`, `.env`(VITE_SUPABASE_URL/ANON_KEY)

## 규칙
- 변경 후 `npm run build`로 빌드 통과 확인.
- 비밀키는 `.env`에만(커밋 금지, .gitignore 처리됨).
- 화면 메타·콘텐츠는 `src/App.tsx`의 `M: Meta`에서 수정.
