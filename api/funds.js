export const config = { runtime: 'edge' };

// ─────────────────────────────────────────────────────
// 환경 변수
// ─────────────────────────────────────────────────────
const BASE_ID = process.env.AIRTABLE_BASE_ID;   // Vercel 환경변수: appGFNu05lUUN5p7l
const TOKEN   = process.env.AIRTABLE_API_TOKEN; // Vercel 환경변수: patWFbJiiN6PlVA6v

// ─────────────────────────────────────────────────────
// 아래 7개 테이블 ID를 직접 확인하고 수정하세요.
// Airtable → Base → Help → API Documentation 에서 확인 가능
// 또는 MCP로 list_tables_for_base 호출 시 각 테이블의 "id" 필드값
// ─────────────────────────────────────────────────────
const TABLES = {
  // 1. 조합 테이블 (펀드명, 설립일, 만기일, 규모, 투자금액, 투자건수)
  funds:          'tbl4kTjRXBfZZqkkb',  // 테이블명: 조합

  // 2. 투자(Investments) 테이블 (회사명, 조합명, 투자종류, 투자일, 투자금, 최신밸류, 상태)
  investments:    'tblTWqFmJPHcUaKcl',  // 테이블명: 투자 (Investments)

  // 3. LP 테이블 (이름, 유형, 납입금액)
  lp:             'tbluuk5qttawnZk1k',  // 테이블명: LP

  // 4. LP 출자 테이블 (이름, 펀드, 약정금액, 회차, 납입금액, 납입일, 상태)
  lpInvestments:  'tbl3ruORr95LGhLk3',  // 테이블명: LP 출자

  // 5. 회사(Companies) 테이블 (회사명, 대표자, 사업자번호, 설립일, 연락처, 이메일, 홈페이지)
  companies:      'tblSAuedQ2O7w9mvd',  // 테이블명: 회사 (Companies)

  // 6. 결산/재무 테이블 (회사명, 기준연도, 자본총액, 부채총액, 매출액, 당기순이익)
  financials:     'tblBxAkCLGurQjFBC',  // 테이블명: 결산/재무

  // 7. TIPS 테이블 (회사명, 협약시작, 협약종료, 상태, 과제명)
  tips:           'tblA6DmgfLifpIpC4',  // 테이블명: TIPS
};

// ─────────────────────────────────────────────────────
// 각 테이블에서 가져올 필드 ID 목록
// 필드 ID가 바뀌면 여기만 수정하면 됩니다.
// ─────────────────────────────────────────────────────
const FIELDS = {
  funds: [
    'fldV6OIb0N1NjJPGX', // 펀드명 (Fund Name)
    'fldyBig7rN3L4zJlF', // 고유번호 (사업자번호)
    'fldMhhjs5UruVxbWa', // 설립일
    'fldi4uHcBCs9AO8FT', // 해산일 (만기, formula)
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
// 단일 테이블 전체 레코드 페이지네이션 조회
// ─────────────────────────────────────────────────────
async function fetchTable(tableKey) {
  const tableId = TABLES[tableKey];
  const fields  = FIELDS[tableKey];

  if (!tableId) throw new Error(`테이블 키 "${tableKey}"가 TABLES에 없습니다.`);
  if (!fields)  throw new Error(`필드 목록 "${tableKey}"가 FIELDS에 없습니다.`);

  const records = [];
  let offset = null;

  do {
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
      json = await res.json();
    } catch (networkErr) {
      throw new Error(`[${tableKey}] 네트워크 오류: ${networkErr.message}`);
    }

    if (!res.ok) {
      const msg = json?.error?.message || json?.error?.type || res.statusText;
      throw new Error(`[${tableKey}] Airtable 오류 ${res.status}: ${msg}`);
    }

    records.push(...(json.records || []));
    offset = json.offset || null;
  } while (offset);

  return records;
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
          !BASE_ID  && 'AIRTABLE_BASE_ID가 설정되지 않았습니다.',
          !TOKEN    && 'AIRTABLE_API_TOKEN이 설정되지 않았습니다.',
        ].filter(Boolean),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 테이블별 독립 조회 (어느 테이블이 실패했는지 특정)
  const results  = {};
  const errors   = [];

  const tableKeys = Object.keys(TABLES);

  await Promise.allSettled(
    tableKeys.map(key =>
      fetchTable(key)
        .then(records => { results[key] = records; })
        .catch(err    => { errors.push({ table: key, message: err.message }); })
    )
  );

  // 하나라도 에러가 있으면 부분 성공 정보와 함께 응답
  if (errors.length > 0) {
    return new Response(
      JSON.stringify({
        error:   '일부 테이블 조회 실패',
        failed:  errors,
        partial: results, // 성공한 테이블 데이터는 그대로 포함
      }),
      {
        status: 207, // 207 Multi-Status: 일부 성공
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  // 전체 성공
  return new Response(
    JSON.stringify({
      funds:         results.funds,
      investments:   results.investments,
      lp:            results.lp,
      lpInvestments: results.lpInvestments,
      companies:     results.companies,
      financials:    results.financials,
      tips:          results.tips,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}
