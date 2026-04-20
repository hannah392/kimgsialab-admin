export const config = { runtime: 'edge' };

// ─────────────────────────────────────────────────────
// 환경 변수 (Vercel 대시보드 → Settings → Environment Variables)
// ─────────────────────────────────────────────────────
const BASE_ID = process.env.AIRTABLE_BASE_ID;   // 예: appGFNu05lUUN5p7l
const TOKEN   = process.env.AIRTABLE_API_TOKEN; // 예: patWFbJiiN6PlVA6v

// ─────────────────────────────────────────────────────
// 테이블 ID 목록 — 테이블명이 바뀌면 여기 ID만 수정
// Airtable URL: airtable.com/appXXX/tblYYY 에서 tblYYY 부분
// ─────────────────────────────────────────────────────
const TABLES = {
  funds:         'tbl4kTjRXBfZZqkkb',  // 테이블명: 조합
  investments:   'tblTWqFmJPHcUaKcl',  // 테이블명: 투자 (Investments)
  lp:            'tbluuk5qttawnZk1k',  // 테이블명: LP
  lpInvestments: 'tbl3ruORr95LGhLk3',  // 테이블명: LP 출자
  companies:     'tblSAuedQ2O7w9mvd',  // 테이블명: 회사 (Companies)
  financials:    'tblBxAkCLGurQjFBC',  // 테이블명: 결산/재무
  tips:          'tblA6DmgfLifpIpC4',  // 테이블명: TIPS
};

// ─────────────────────────────────────────────────────
// 각 테이블에서 가져올 필드 ID 목록
// ─────────────────────────────────────────────────────
const FIELDS = {
  funds: [
    'fldV6OIb0N1NjJPGX', // 펀드명 (Fund Name)
    'fldyBig7rN3L4zJlF', // 고유번호
    'fldMhhjs5UruVxbWa', // 설립일
    'fldi4uHcBCs9AO8FT', // 해산일 (formula)
    'fldzoFd7iVY7yiPPK', // 펀드 규모 (Fund Size)
    'fldnuy2hJjWTiN6Nm', // 투자 금액 (rollup)
    'fldmkTRlWMKqtVTzb', // 투자 건수 (rollup)
  ],
  investments: [
    'fldaLQL0asyBs12XS', // 투자 상세 ID (autoNumber)
    'fldKgHckkom7BzziQ', // 회사명
    'fldZWbiEpbk8DXzQ3', // 조합명 (linked)
    'fldsQPreuTgF1qMMl', // 투자 종류 (singleSelect)
    'fldAc2Zvntn9pIIIk', // 투자일
    'fldQQgAjQPCMLo2iQ', // 투자금
    'fldxuYZbp322jb7r6', // 최신 밸류 (formula)
    'fldmtLTqZtMqndSHi', // 상태 (singleSelect)
  ],
  lp: [
    'fldOZaZAlqvgE6nZd', // 이름
    'fldZKMiXmuXDJAT02', // 유형 (singleSelect: 개인/법인)
    'fld3oP1yE6ggCK7dO', // 납입 금액 (rollup)
  ],
  lpInvestments: [
    'fldqeRWPBSGYi2nvQ', // 이름
    'fldR4UKRBuV5UyJpy', // 펀드 (linked)
    'fldrqN5GrwUwgAiLk', // 상태 (singleSelect)
    'fldie2X4997OydZOu', // 약정 금액
    'fldbUrAlfUiq9NWv4', // 회차 (singleSelect)
    'fldJbdpDgT3xg8l2v', // 납입 금액
    'fld9ajRSMny7vLRzj', // 납입일
  ],
  companies: [
    'fldgvMHmMUvjzkNtK', // 회사명 (Companies)
    'fldRILTx5SzS5ifLz', // 대표자
    'fldfkh29dbKxG5jeX', // 사업자등록번호
    'fldBfGloifB0ovXA2', // 법인 설립일
    'fldaXqn7XHnIoECly', // 연락처
    'fldrO3QIWyUTcL6xb', // 이메일
    'fldMASYU2jSD1SofT', // 홈페이지
  ],
  financials: [
    'fldDOI9NhZqzYwQFw', // 회사명 (linked)
    'fldVPLgQVAspyS7wR', // 기준 연도
    'fld4Z9N1VkrFLKsyK', // 자본 총액
    'flddSGbYqYC9QnqOY', // 부채 총액
    'fld9VsXIPmAVIpYsj', // 매출액
    'flddTOGVyVVdIiWGc', // 당기순이익
  ],
  tips: [
    'fldU0AYnq3LOL3ZX6', // 회사명
    'fld0xgv3qOKp3ME7i', // 협약 시작
    'fldxFpLI6w1aUqJOe', // 협약 종료
    'fldy8ZvjAfmD3LUd8', // 상태 (singleSelect)
    'fldyyYuGa75wzE3Gf', // 과제명
  ],
};

// ─────────────────────────────────────────────────────
// 단일 테이블 조회 — 레코드 0건이어도 [] 반환, 절대 throw 안 함
// ─────────────────────────────────────────────────────
async function fetchTableSafe(tableKey) {
  const tableId = TABLES[tableKey];
  const fields  = FIELDS[tableKey];

  // 테이블 설정 자체가 없으면 빈 배열 + 경고
  if (!tableId || !fields) {
    return { records: [], warning: `테이블 키 "${tableKey}" 설정 없음` };
  }

  const records = [];
  let offset = null;
  let pageCount = 0;

  try {
    do {
      // 무한 루프 방어 (최대 50페이지 × 100건 = 5000건)
      if (++pageCount > 50) break;

      const params = new URLSearchParams({ pageSize: '100' });
      fields.forEach(f => params.append('fields[]', f));
      if (offset) params.set('offset', offset);

      const url = `https://api.airtable.com/v0/${BASE_ID}/${tableId}?${params}`;

      let res, json;
      try {
        res  = await fetch(url, {
          headers: { Authorization: `Bearer ${TOKEN}` },
          cache: 'no-store',
        });
        // JSON 파싱 실패 대비
        const text = await res.text();
        try { json = JSON.parse(text); }
        catch { json = {}; }
      } catch (networkErr) {
        return { records, warning: `[${tableKey}] 네트워크 오류: ${networkErr.message}` };
      }

      if (!res.ok) {
        const msg = json?.error?.message || json?.error?.type || `HTTP ${res.status}`;
        return { records, warning: `[${tableKey}] Airtable 오류: ${msg}` };
      }

      // records 필드가 없거나 배열이 아닐 경우 방어
      const page = Array.isArray(json?.records) ? json.records : [];
      records.push(...page);
      offset = typeof json?.offset === 'string' ? json.offset : null;

    } while (offset);

    return { records };

  } catch (unexpectedErr) {
    // 예상치 못한 런타임 에러도 안전하게 처리
    return { records, warning: `[${tableKey}] 예외 발생: ${unexpectedErr.message}` };
  }
}

// ─────────────────────────────────────────────────────
// Edge Handler
// ─────────────────────────────────────────────────────
export default async function handler(req) {

  // 환경변수 체크
  if (!BASE_ID || !TOKEN) {
    return new Response(
      JSON.stringify({
        error: '환경변수 누락',
        detail: [
          !BASE_ID && 'AIRTABLE_BASE_ID 미설정',
          !TOKEN   && 'AIRTABLE_API_TOKEN 미설정',
        ].filter(Boolean),
        // 빈 배열 보장 — 프런트엔드가 forEach로 죽지 않도록
        funds: [], investments: [], lp: [], lpInvestments: [],
        companies: [], financials: [], tips: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 7개 테이블 병렬 조회 — 하나가 실패해도 나머지 계속
  const [
    fundsRes, investmentsRes, lpRes, lpInvRes,
    companiesRes, financialsRes, tipsRes,
  ] = await Promise.all([
    fetchTableSafe('funds'),
    fetchTableSafe('investments'),
    fetchTableSafe('lp'),
    fetchTableSafe('lpInvestments'),
    fetchTableSafe('companies'),
    fetchTableSafe('financials'),
    fetchTableSafe('tips'),
  ]);

  // 경고 수집 (warning이 있는 테이블만)
  const warnings = [
    fundsRes, investmentsRes, lpRes, lpInvRes,
    companiesRes, financialsRes, tipsRes,
  ]
    .filter(r => r.warning)
    .map(r => r.warning);

  return new Response(
    JSON.stringify({
      // 각 키는 항상 배열 (최소 []) — index.html의 forEach가 절대 죽지 않음
      funds:         Array.isArray(fundsRes.records)         ? fundsRes.records         : [],
      investments:   Array.isArray(investmentsRes.records)   ? investmentsRes.records   : [],
      lp:            Array.isArray(lpRes.records)            ? lpRes.records            : [],
      lpInvestments: Array.isArray(lpInvRes.records)         ? lpInvRes.records         : [],
      companies:     Array.isArray(companiesRes.records)     ? companiesRes.records     : [],
      financials:    Array.isArray(financialsRes.records)    ? financialsRes.records    : [],
      tips:          Array.isArray(tipsRes.records)          ? tipsRes.records          : [],
      // 경고가 있으면 포함 (없으면 키 자체 생략)
      ...(warnings.length > 0 && { warnings }),
    }),
    {
      status: 200, // 경고가 있어도 200 — 프런트가 정상 파싱 가능
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}
