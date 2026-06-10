import { useMemo, useState } from 'react';
import { AppLayout, Field, Chip, useLocalStorage, type Meta } from './ui';
import { ask, hasKey } from './lib/ai';

/* ──────────────────────────────────────────────────────────────────────────
 * 청년 AI 리터러시 격차 진단 및 정책 수요 예측 모델
 * 자가진단(5개 영역) → 영역별 점수·종합 수준 → 집단 기준선 대비 격차 →
 * 격차·프로필 기반 정책/교육 수요 예측(룰 기반 + 선택적 AI 코멘트).
 * ────────────────────────────────────────────────────────────────────────── */
const M: Meta = {
  id: 17, icon: '📊', title: '청년 AI 리터러시 진단', tagline: '자가진단으로 AI 리터러시 격차를 측정하고, 집단별 정책·교육 수요를 예측하는 모델',
  members: ['최윤경'], color: '#2563EB', ai: true,
  problem:
    'AI가 일상과 일자리로 빠르게 들어오면서, 같은 청년 안에서도 전공·경험에 따라 AI 리터러시 격차가 벌어집니다. ' +
    '하지만 "누가, 어느 영역에서, 얼마나" 부족한지에 대한 진단 도구는 부족합니다. 이 모델은 5개 영역 자가진단으로 개인의 리터러시를 ' +
    '측정하고, 같은 집단(전공계열·경험)의 기준선과 비교해 격차를 드러낸 뒤, 그 격차를 메울 정책·교육 수요를 예측해 제안합니다.',
  features: [
    { icon: '📝', title: '5영역 자가진단', desc: '이해·활용·비판적 사고·윤리/안전·실무의 15문항 리커트 진단' },
    { icon: '🧭', title: '영역별 프로파일', desc: '영역마다 점수를 막대로 시각화하고 종합 리터러시 수준 산출' },
    { icon: '📉', title: '집단 대비 격차', desc: '전공계열·경험 기준선과 비교해 강·약 영역과 격차를 표시' },
    { icon: '🏛️', title: '정책 수요 예측', desc: '격차·프로필을 규칙 모델에 넣어 필요한 정책/교육과 수요 강도 추정' },
    { icon: '🤖', title: 'AI 정책 코멘트', desc: '(선택) 결과를 요약해 우선순위와 설계 제언을 생성' },
    { icon: '💾', title: '응답 저장', desc: '응답을 브라우저에 저장 — 다시 열어도 결과 유지' },
  ],
  howto: [
    '나이대·전공계열·AI 경험을 선택해 집단을 설정합니다',
    '15개 문항에 1~5점으로 답하면 영역별 점수가 즉시 계산됩니다',
    '집단 기준선 대비 격차와, 그에 맞춘 정책·교육 수요 예측을 확인하세요',
  ],
  facts: [
    { value: '5영역', label: '리터러시 측정 차원' },
    { value: '15문항', label: '리커트 자가진단' },
    { value: '3×3', label: '전공·경험 기준선 셀' },
    { value: '실시간', label: '격차·수요 계산' },
  ],
  info: [
    { title: 'AI 리터러시란', body: 'AI를 이해하고(개념), 활용하고(도구), 비판적으로 평가하며(편향·오류), 윤리적으로 책임 있게 쓰는 역량의 묶음입니다. 본 모델은 여기에 실무 적용을 더해 5영역으로 봅니다.' },
    { title: '격차(gap)의 의미', body: '격차는 같은 집단의 기대 기준선과 내 점수의 차이입니다. 양수면 부족(수요 발생), 음수면 평균 이상입니다. 절대 점수보다 집단 대비 위치가 정책 설계에 유용합니다.' },
    { title: '수요 예측의 한계', body: '이 예측은 자가응답 기반의 규칙 모델로, 실제 정책 효과를 보장하지 않습니다. 수요의 방향성과 우선순위를 빠르게 가늠하는 탐색 도구로 활용하세요.' },
  ],
  pipeline: [
    '문항 응답을 영역별로 평균내어 0~100 점수로 환산',
    '프로필(전공계열·경험)로 집단 기준선을 조회',
    '영역별 (기준선 − 점수)로 격차를 계산해 약점 영역 식별',
    '격차·프로필을 규칙 모델에 매핑해 정책/교육과 수요 강도(상·중·하) 추정',
    '(선택) 결과를 AI가 요약해 우선순위·설계 제언 생성',
  ],
  techNotes: [
    { title: '규칙 기반 수요 모델', body: '영역별 격차 임계값과 프로필 가중치를 조합해 정책 카드와 수요 강도를 결정 — 투명하고 설명 가능한 화이트박스 방식입니다.' },
    { title: '재현 가능한 진단', body: '응답·기준선·매핑 규칙이 모두 코드에 담겨 있어 동일 입력이면 동일 결과를 냅니다(결정론적).' },
  ],
  targets: ['AI 역량 격차를 점검하려는 청년', '교육·정책 수요를 파악하려는 기관', '자기 AI 리터러시를 진단하려는 학생·직장인'],
  goals: [
    '5영역 자가진단으로 AI 리터러시를 측정한다',
    '집단 기준선 대비 격차를 드러내 약점 영역을 식별한다',
    '격차 기반 정책·교육 수요를 규칙 모델로 예측한다',
  ],
  scenarios: [
    '나이대·전공계열·AI 경험으로 집단을 설정한다',
    '15문항에 1~5점으로 답해 영역별 점수를 받는다',
    '집단 대비 격차와 정책·교육 수요 예측을 확인한다',
  ],
  screens: [
    { name: '집단 설정', desc: '나이대·전공계열·AI 경험 선택' },
    { name: '자가진단', desc: '5영역 15문항 리커트 응답' },
    { name: '진단 결과', desc: '종합 수준 게이지 + 영역별 점수·집단 기준선·격차' },
    { name: '정책·교육 수요 예측', desc: '약점 영역 기반 정책 카드 + 수요 강도(상·중·하)' },
    { name: 'AI 정책 코멘트', desc: '(선택) 우선순위·설계 제언 요약' },
  ],
  pipelineDetail: [
    { step: '점수 환산', detail: '문항 응답을 영역별로 평균내어 0~100 점수로 환산한다.' },
    { step: '기준선 조회', detail: '프로필(전공계열·경험)로 집단 기준선을 조회한다.' },
    { step: '격차 계산', detail: '영역별 (기준선 − 점수)로 격차를 계산해 약점 영역을 식별한다.' },
    { step: '수요 예측', detail: '격차·프로필을 규칙 모델에 매핑해 정책/교육과 수요 강도(상·중·하)를 추정한다.' },
    { step: 'AI 코멘트(선택)', detail: '키가 있으면 결과를 요약해 우선순위·설계 제언을 생성한다.' },
  ],
  promptNotes: [
    '격차·수요 예측은 규칙 모델이 결정적으로 수행하고, AI는 우선순위·설계 제언만 요약 보조한다.',
    '진단 결과(프로필·종합 점수·영역별 격차)를 system 프롬프트에 넣어 정책 코멘트를 생성한다.',
    'API 키가 없어도 5영역 진단·격차·수요 예측은 모두 동작한다.',
  ],
  architecture:
    '백엔드 없는 React SPA. 공통 레이아웃·5탭은 src/ui.tsx, 진단 모델은 src/App.tsx가 담당한다. ' +
    '격차·수요 예측은 App.tsx의 결정적 규칙 모델로 계산하고, 정책 코멘트는 src/lib/ai.ts(선택)로 보강하며, 응답은 브라우저 localStorage에 저장한다.',
  structure: [
    { path: 'src/App.tsx', desc: '5영역 진단·격차·정책 수요 예측 + 메타(M)' },
    { path: 'src/ui.tsx', desc: '공통 레이아웃·5탭·UI 헬퍼' },
    { path: 'src/lib/ai.ts', desc: 'OpenAI chat 헬퍼(선택 정책 코멘트)' },
    { path: 'src/index.css', desc: '테마·게이지/막대 스타일' },
  ],
  dataModel: [
    { name: 'Dim (5영역)', desc: '이해·활용·비판적사고·윤리안전·실무 차원' },
    { name: 'Policy', desc: '영역별 정책 카드·수요 강도' },
    { name: '저장', desc: 'localStorage "lit_profile"(집단)·"lit_answers"(응답)' },
  ],
  deploy:
    'Vite 빌드(base: "./") 후 GitHub Actions(deploy.yml)가 main push 시 GitHub Pages로 자동 배포 → aebonlee.github.io/project17/',
  scope: {
    include: ['5영역 15문항 자가진단 → 영역 점수·집단 격차', '정책·교육 수요 예측·응답 저장', '규칙 모델 + AI 정책 코멘트(선택)'],
    exclude: ['실제 정책 효과 검증', '대규모 표본 통계', '기관 대시보드'],
  },
  pitch: [
    '"누가 어느 영역에서 얼마나" 부족한지 진단하는 도구',
    '집단 대비 격차로 정책 우선순위를 가늠하는 점',
    '규칙 모델은 결정론적·설명가능(화이트박스)',
  ],
  stack: ['React 18', 'TypeScript', 'Vite', '규칙기반 모델', 'OpenAI(선택)'],
  links: [{ label: 'OECD AI 역량 프레임워크', url: 'https://www.oecd.org/' }],
};

type Dim = '이해' | '활용' | '비판적 사고' | '윤리·안전' | '실무 적용';
const DIM_COLOR: Record<Dim, string> = {
  '이해': '#2563EB', '활용': '#0891b2', '비판적 사고': '#7c3aed', '윤리·안전': '#16a34a', '실무 적용': '#ea580c',
};
const QUESTIONS: { dim: Dim; text: string }[] = [
  { dim: '이해', text: '머신러닝·생성형 AI가 대략 어떻게 작동하는지 설명할 수 있다.' },
  { dim: '이해', text: '학습 데이터·모델·프롬프트 같은 기본 용어를 이해한다.' },
  { dim: '이해', text: 'AI가 잘하는 일과 못하는 일의 경계를 구분할 수 있다.' },
  { dim: '활용', text: '챗봇·이미지 생성 등 AI 도구를 실제 과제에 사용해 봤다.' },
  { dim: '활용', text: '원하는 결과를 얻도록 프롬프트를 다듬을 수 있다.' },
  { dim: '활용', text: '새로운 AI 도구를 스스로 찾아 익히는 편이다.' },
  { dim: '비판적 사고', text: 'AI의 답이 틀릴 수 있음을 알고 사실을 따로 확인한다.' },
  { dim: '비판적 사고', text: 'AI 결과의 편향·환각(hallucination) 가능성을 의식한다.' },
  { dim: '비판적 사고', text: 'AI가 만든 콘텐츠와 사람이 만든 것을 비판적으로 비교한다.' },
  { dim: '윤리·안전', text: '개인정보·저작권 등 AI 사용의 윤리 이슈를 안다.' },
  { dim: '윤리·안전', text: '민감정보를 AI에 함부로 입력하지 않도록 주의한다.' },
  { dim: '윤리·안전', text: 'AI 사용을 밝혀야 하는 상황(과제·업무)을 판단할 수 있다.' },
  { dim: '실무 적용', text: '학업·업무 생산성을 AI로 실제로 높여 본 적이 있다.' },
  { dim: '실무 적용', text: 'AI를 내 진로·직무에 어떻게 쓸지 구체적 계획이 있다.' },
  { dim: '실무 적용', text: 'AI 도구를 업무 흐름(워크플로)에 결합해 본 경험이 있다.' },
];
const DIMS: Dim[] = ['이해', '활용', '비판적 사고', '윤리·안전', '실무 적용'];

const MAJORS = ['공학·자연', '인문·사회', '예체능', '비전공/기타'] as const;
const EXPS = ['처음', '기초 보유', '경험 많음'] as const;
type Major = typeof MAJORS[number];
type Exp = typeof EXPS[number];

// 집단 기준선(기대 수준, 0~100) — 경험·전공계열에 따른 기대치
const baseline = (major: Major, exp: Exp, dim: Dim): number => {
  const byExp: Record<Exp, number> = { '처음': 45, '기초 보유': 62, '경험 많음': 78 };
  let b = byExp[exp];
  if (major === '공학·자연' && (dim === '이해' || dim === '실무 적용')) b += 6;
  if (major === '인문·사회' && (dim === '윤리·안전' || dim === '비판적 사고')) b += 5;
  if (major === '예체능' && dim === '활용') b += 3;
  if (major === '비전공/기타') b -= 3;
  return Math.max(0, Math.min(100, b));
};

const levelOf = (score: number) =>
  score >= 80 ? { t: '선도', c: '#16a34a' } : score >= 65 ? { t: '능숙', c: '#2563EB' } : score >= 45 ? { t: '기초', c: '#f59e0b' } : { t: '입문', c: '#ef4444' };

interface Policy { title: string; desc: string; need: '상' | '중' | '하'; dim: Dim; }
const needColor = (n: string) => n === '상' ? { bg: '#fee2e2', c: '#991b1b' } : n === '중' ? { bg: '#fef9c3', c: '#854d0e' } : { bg: '#dcfce7', c: '#166534' };

const POLICY_BY_DIM: Record<Dim, { title: string; desc: string }> = {
  '이해': { title: 'AI 기초 개념 공개강좌', desc: '생성형 AI 원리·용어를 다루는 무료 온라인 입문 과정과 지역 도서관 연계 강좌.' },
  '활용': { title: '실습형 AI 도구 부트캠프', desc: '프롬프트·도구 활용을 손으로 익히는 단기 집중 워크숍과 실습 크레딧 지원.' },
  '비판적 사고': { title: 'AI 비판적 활용·팩트체크 교육', desc: '환각·편향을 검증하는 정보 판별 모듈을 대학·평생교육에 편성.' },
  '윤리·안전': { title: 'AI 윤리·개인정보 가이드라인', desc: '청년 대상 AI 사용 윤리 캠페인과 안전한 사용 체크리스트 보급.' },
  '실무 적용': { title: '직무 연계 AI 실무 프로젝트', desc: '진로·직무에 AI를 적용하는 프로젝트형 과정과 채용 연계 멘토링.' },
};

const App = () => {
  const [profile, setProfile] = useLocalStorage<{ age: string; major: Major; exp: Exp }>('lit_profile', { age: '20대', major: '공학·자연', exp: '기초 보유' });
  const [answers, setAnswers] = useLocalStorage<Record<number, number>>('lit_answers', {});
  const [aiText, setAiText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  const answered = Object.keys(answers).length;
  const done = answered === QUESTIONS.length;

  const dimScores = useMemo(() => {
    const r = {} as Record<Dim, number>;
    DIMS.forEach((d) => {
      const idxs = QUESTIONS.map((q, i) => ({ q, i })).filter((x) => x.q.dim === d).map((x) => x.i);
      const vals = idxs.map((i) => answers[i]).filter((v) => v != null) as number[];
      r[d] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length - 1) / 4 * 100) : 0;
    });
    return r;
  }, [answers]);
  const overall = useMemo(() => Math.round(DIMS.reduce((a, d) => a + dimScores[d], 0) / DIMS.length), [dimScores]);
  const lv = levelOf(overall);

  const gaps = useMemo(() => DIMS.map((d) => ({ dim: d, score: dimScores[d], base: baseline(profile.major, profile.exp, d), gap: baseline(profile.major, profile.exp, d) - dimScores[d] })), [dimScores, profile]);

  const policies = useMemo<Policy[]>(() => {
    return gaps
      .filter((g) => g.gap > 4)
      .sort((a, b) => b.gap - a.gap)
      .map((g) => ({ ...POLICY_BY_DIM[g.dim], dim: g.dim, need: (g.gap >= 22 ? '상' : g.gap >= 12 ? '중' : '하') as Policy['need'] }));
  }, [gaps]);

  const runAI = async () => {
    setAiBusy(true); setAiText('');
    const summary = [
      `프로필: ${profile.age} · ${profile.major} · AI경험 ${profile.exp}`,
      `종합 ${overall}점(${lv.t})`,
      `영역별 점수/격차: ${gaps.map((g) => `${g.dim} ${g.score}점(격차 ${g.gap > 0 ? '+' : ''}${g.gap})`).join(', ')}`,
    ].join('\n');
    try {
      const out = await ask(
        '너는 청년 디지털·AI 교육정책 분석가다. 아래 진단 결과를 바탕으로 한국어로 (1)가장 시급한 격차 영역 1~2개, (2)추천 정책·교육의 우선순위, (3)설계 시 유의점을 간결한 불릿으로 정리하라. 6줄 이내.',
        summary, { temperature: 0.5, max_tokens: 450 },
      );
      setAiText(out);
    } catch {
      setAiText('AI 코멘트를 쓰려면 위에서 OpenAI API 키를 입력하세요. (키 없이도 진단·격차·정책 예측은 모두 동작합니다.)');
    } finally { setAiBusy(false); }
  };

  const feature = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 프로필 */}
      <div className="card">
        <div className="seclabel" style={{ color: M.color }}>👤 집단 설정</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
          <Field label="나이대">
            <div className="chips">{['10대', '20대', '30대'].map((a) => <Chip key={a} active={profile.age === a} color={M.color} onClick={() => setProfile({ ...profile, age: a })}>{a}</Chip>)}</div>
          </Field>
          <Field label="AI 경험">
            <div className="chips">{EXPS.map((e) => <Chip key={e} active={profile.exp === e} color={M.color} onClick={() => setProfile({ ...profile, exp: e })}>{e}</Chip>)}</div>
          </Field>
        </div>
        <Field label="전공계열"><div className="chips" style={{ marginTop: 4 }}>{MAJORS.map((mj) => <Chip key={mj} active={profile.major === mj} color={M.color} onClick={() => setProfile({ ...profile, major: mj })}>{mj}</Chip>)}</div></Field>
      </div>

      {/* 진단 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="seclabel" style={{ color: M.color }}>📝 자가진단 ({answered}/{QUESTIONS.length})</div>
          {answered > 0 && <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setAnswers({})}>초기화</button>}
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--faint)', margin: '4px 0 14px' }}>1=전혀 아니다 · 5=매우 그렇다</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {QUESTIONS.map((q, i) => (
            <div key={i} className="q">
              <div className="q__head">
                <span className="q__no" style={{ background: DIM_COLOR[q.dim] }}>{i + 1}</span>
                <div><div className="q__text">{q.text}</div><span className="q__dim">{q.dim}</span></div>
              </div>
              <div className="likert">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} className={answers[i] === v ? 'on' : ''} style={answers[i] === v ? { background: DIM_COLOR[q.dim] } : undefined} onClick={() => setAnswers({ ...answers, [i]: v })}>
                    <b>{v}</b>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 결과 */}
      {answered > 0 && (
        <div className="card">
          <div className="seclabel" style={{ color: M.color }}>🧭 진단 결과 {!done && <span style={{ color: 'var(--faint)', fontWeight: 400 }}>(미응답 문항은 0점으로 계산)</span>}</div>
          <div className="gauge">
            <div className="gauge__num" style={{ color: lv.c }}>{overall}</div>
            <div style={{ fontSize: 12, color: 'var(--faint)' }}>종합 AI 리터러시 / 100</div>
            <span className="gauge__lv" style={{ background: lv.c }}>{lv.t} 수준</span>
          </div>
          <div className="dims">
            {gaps.map((g) => (
              <div key={g.dim} className="dimrow">
                <span>{g.dim}</span>
                <div className="dtrack">
                  <i style={{ width: `${g.score}%`, background: DIM_COLOR[g.dim] }} />
                  <span className="mark" style={{ left: `${g.base}%` }} title={`집단 기준선 ${g.base}`} />
                </div>
                <b style={{ color: g.gap > 4 ? '#ef4444' : '#16a34a' }}>{g.gap > 0 ? `+${g.gap}` : g.gap}</b>
              </div>
            ))}
          </div>
          <p className="legend">막대 = 내 점수 · 세로선 = 같은 집단({profile.major}·{profile.exp}) 기준선 · 오른쪽 = 격차(+면 부족)</p>
        </div>
      )}

      {/* 정책 수요 예측 */}
      {answered > 0 && (
        <div className="card">
          <div className="seclabel" style={{ color: M.color }}>🏛️ 정책·교육 수요 예측</div>
          {policies.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {policies.map((p, i) => {
                const nc = needColor(p.need);
                return (
                  <div key={i} className="policy" style={{ borderLeftColor: DIM_COLOR[p.dim] }}>
                    <h4>{p.title}</h4>
                    <p>{p.desc}</p>
                    <span className="need" style={{ background: nc.bg, color: nc.c }}>{p.dim} · 수요 {p.need}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--sub)', marginTop: 10 }}>모든 영역이 집단 기준선 이상입니다. 추가 교육 수요가 낮은 선도 그룹으로 분류됩니다. 🎉</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: M.color }}>🤖 AI 정책 코멘트</span>
            <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} disabled={aiBusy} onClick={runAI}>
              {aiBusy ? '생성 중…' : hasKey() ? '코멘트 생성' : '키 입력 후 사용'}
            </button>
          </div>
          {aiText && <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, marginTop: 12 }}>{aiText}</p>}
        </div>
      )}
    </div>
  );

  return <AppLayout m={M} feature={feature} />;
};

export default App;
