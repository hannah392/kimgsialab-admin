// Edge runtime 제거 → Serverless로 변경 (Edge는 25초 타임아웃 → 8개 테이블 조회 시 실패)

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN   = process.env.AIRTABLE_API_TOKEN;

const TABLES = {
  funds:         'tbl4kTjRXBfZZqkkb',  // 시트명: 조합
  investments:   'tblTWqFmJPHcUaKcl',  // 시트명: 투자 (Investments)
  lp:            'tbluuk5qttawnZk1k',  // 시트명: LP
  lpInvestments: 'tbl3ruORr95LGhLk3',  // 시트명: LP 출자
  companies:     'tblSAuedQ2O7w9mvd',  // 시트명: 회사 (Companies)
  financials:    'tblBxAkCLGurQjFBC',  // 시트명: 결산/재무
  tips:          'tblA6DmgfLifpIpC4',  // 시트명: TIPS
  fundFees:      'tblIAJufUemwV6bAH',  // 시트명: 조합 보수 (신규)
};

// ─────────────────────────────────────────────────────────────
// Airtable 필드 ID 맵 (returnFieldsByFieldId=true 사용)
// 전체 스키마 기반으로 화면 표시에 필요한 모든 필드 포함
// ─────────────────────────────────────────────────────────────
const FIELDS = {
  // 조합: 기본 정보 + 수탁기관 + NAV(투자 잔액) + 관리보수
  funds: [
    'fldV6OIb0N1NjJPGX', // 펀드명
    'fldyBig7rN3L4zJlF', // 고유번호(사업자번호)
    'fldMhhjs5UruVxbWa', // 설립일
    'fldi4uHcBCs9AO8FT', // 해산일
    'fldtDF2gEA28ZLZhW', // 경과일
    'fldzoFd7iVY7yiPPK', // 펀드 규모(결성금액)
    'fldphEKkJ4WMFPvmG', // 수탁기관 ★신규
    'fldnuy2hJjWTiN6Nm', // 투자 금액(납입금액 rollup)
    'fldmkTRlWMKqtVTzb', // 투자 건수
    'fldFZSDfK0Fc0ujvG', // 투자 잔액(NAV rollup) ★신규
    'fldZSUPEuNrlwdb90', // 관리 보수(rollup) ★신규
  ],

  // 투자(Investments): 전체 상세 필드 - 투자 상세 모달용
  investments: [
    'fldaLQL0asyBs12XS', // 투자 상세 ID
    'fldKgHckkom7BzziQ', // 회사명
    'fldZWbiEpbk8DXzQ3', // 조합명 (link)
    'fldZjyT5HRKGsAKAF', // 투자 회차 ★신규
    'fldVeuWSNWXFtrvrf', // 법인설립일 ★신규
    'fldAc2Zvntn9pIIIk', // 투자일
    'fldi7qm8CTqIZ3qpH', // 입금일 ★신규
    'fldsQPreuTgF1qMMl', // 투자 종류
    'fldy46UcaaVJlNx2k', // 투자 단가 ★신규
    'fld1WFCec53pcP5Pe', // 보유 주식 수 ★신규
    'fldQQgAjQPCMLo2iQ', // 투자금
    'fldwmEXqDq6r2Z6oY', // 투자 잔액 ★신규
    'fld10J4a1Nw3g0Tcu', // 투자 후 발행 주식 수 ★신규
    'fldZd40MHaJu1JnY6', // 투자 당시 밸류 ★신규
    'fldW8PaMv6LPP4mu8', // 투자 당시 지분율 ★신규
    'fldIqOZLbd6fp9qaE', // 최신 주식 단가 ★신규
    'fldjUeFRzOQEpNtav', // 최신 보유 주식 수 ★신규
    'fldObhdSDzdpN7iwV', // 최신 전체 발행 주식 수 ★신규
    'fldxuYZbp322jb7r6', // 최신 밸류
    'fldLWcwV0JcYiffUA', // 최신 지분율 ★신규
    'fldXZ0dson7QbVvhN', // 멀티플 ★신규
    'fldmtLTqZtMqndSHi', // 상태
    'fldArX7YLKODRvCP4', // 회수 단가 ★신규
    'fldPXdLQIr3xsqVH1', // 회수 금액 ★신규
    'fldwVs2GgUEuiH5Ir', // 상태 변경일 ★신규
    'fldWQi4sa7tMWdsTL', // 투자계약서 URL ★신규
    'fldHN12fLzJVsuWaM', // 소속 기수 ★신규
  ],

  // LP: 기본 + 연락처·이메일·주소·비고 (민감정보는 미수집)
  lp: [
    'fldOZaZAlqvgE6nZd', // 이름
    'fldZKMiXmuXDJAT02', // 유형
    'fld0GJEcJKtajjNsL', // 연락처 ★신규
    'fldJyYxBNekbUCEuI', // 이메일 ★신규
    'fldHFDYcfCUwVdk1l', // 주소 ★신규
    'fldDfiEn9pZ2OfXqD', // 비고 ★신규
    'fld3oP1yE6ggCK7dO', // 납입 금액(rollup)
  ],

  // LP 출자: 기존 + 출자증서 번호
  lpInvestments: [
    'fldqeRWPBSGYi2nvQ', // 이름
    'fldR4UKRBuV5UyJpy', // 펀드 (link)
    'fldrqN5GrwUwgAiLk', // 상태
    'fldie2X4997OydZOu', // 약정 금액
    'fldbUrAlfUiq9NWv4', // 회차
    'fldJbdpDgT3xg8l2v', // 납입 금액
    'fld9ajRSMny7vLRzj', // 납입일
    'fldKdZ5krB3PeJ4pE', // 출자증서 번호 ★신규
  ],

  // 회사: 기존 + 보유주식수
  companies: [
    'fldgvMHmMUvjzkNtK', // 회사명
    'fldRILTx5SzS5ifLz', // 대표자
    'fldfkh29dbKxG5jeX', // 사업자등록번호
    'fldBfGloifB0ovXA2', // 법인 설립일
    'fldaXqn7XHnIoECly', // 연락처
    'fldrO3QIWyUTcL6xb', // 이메일
    'fldMASYU2jSD1SofT', // 홈페이지
    'fldA319Rs3posTno3', // 보유 주식 수(rollup) ★신규
  ],

  // 결산/재무: 모든 필드
  financials: [
    'fldDOI9NhZqzYwQFw', // 회사명 (link)
    'fldVPLgQVAspyS7wR', // 기준 연도
    'fld4Z9N1VkrFLKsyK', // 자본 총액
    'flddSGbYqYC9QnqOY', // 부채 총액
    'fld9VsXIPmAVIpYsj', // 매출액
    'flddTOGVyVVdIiWGc', // 당기순이익
  ],

  // TIPS: 기존 + 유형 + 연구개발계획서 URL
  tips: [
    'fldU0AYnq3LOL3ZX6', // 회사명
    'fld0xgv3qOKp3ME7i', // 협약 시작
    'fldxFpLI6w1aUqJOe', // 협약 종료
    'fldeIwoakzemhRcc5', // 유형 ★신규
    'fldy8ZvjAfmD3LUd8', // 상태
    'fldyyYuGa75wzE3Gf', // 과제명
    'fldoXod5tZlOD0cEm', // 연구개발계획서 URL ★신규
  ],

  // 조합 보수(fund fees): 신규 테이블
  fundFees: [
    'fldtZYDDOLyL0MT3A', // Id
    'fldYg8S3CAoFzusm9', // 조합명 (link)
    'fldR6d1ptXQkYqVPF', // 보수 유형
    'fld5B8jJ6QjWRyNxn', // 정산 기간 시작일
    'fldZYcuqEAg9aeuXZ', // 정산 기간 종료일
    'fldnMjwflwtJI1zy4', // 정산주기
    'fldmKQenFvn2kyFqF', // 보수금액
    'fldrSVFn7e0XnT1DA', // 보수율
    'fld7BqeSeW4cC72Zl', // 지급일
    'fldXaxFzyeAQrqfA4', // 기준 금액
  ],
};

function buildUrl(tableId, fields, offset) {
  const fieldStr  = fields.map(f => `fields%5B%5D=${f}`).join('&');
  const offsetStr = offset ? `&offset=${encodeURIComponent(offset)}` : '';
  // returnFieldsByFieldId=true: 응답에서 cellValuesByFieldId 형식으로 받기 (한글 필드명 회피)
  return `https://api.airtable.com/v0/${BASE_ID}/${tableId}?pageSize=100&returnFieldsByFieldId=true&${fieldStr}${offsetStr}`;
}

async function fetchTableSafe(tableKey) {
  const tableId = TABLES[tableKey];
  const fields  = FIELDS[tableKey];
  if (!tableId || !fields) return { records: [], warning: `설정 없음: ${tableKey}` };

  const records = [];
  let offset = null;
  let page   = 0;

  try {
    do {
      if (++page > 50) break;
      const url = buildUrl(tableId, fields, offset);
      let res, body, json;

      try {
        res  = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
        body = await res.text();
      } catch (netErr) {
        return { records, warning: `[${tableKey}] 네트워크 오류: ${netErr.message}` };
      }

      if (!body || body.trim() === '')
        return { records, warning: `[${tableKey}] 빈 응답 (HTTP ${res.status})` };

      try { json = JSON.parse(body); }
      catch { return { records, warning: `[${tableKey}] JSON 파싱 실패 (HTTP ${res.status}): ${body.slice(0,200)}` }; }

      if (!res.ok) {
        const msg = json?.error?.message || json?.error?.type || `HTTP ${res.status}`;
        return { records, warning: `[${tableKey}] Airtable 오류: ${msg}` };
      }

      // Airtable 응답 정규화: returnFieldsByFieldId=true 시 fields 키에 fld... 키로 값이 들어옴
      // index.html 호환을 위해 cellValuesByFieldId로 별칭
      const pageRecs = Array.isArray(json?.records) ? json.records : [];
      pageRecs.forEach(r => {
        if (r && r.fields && !r.cellValuesByFieldId) {
          r.cellValuesByFieldId = r.fields;
        }
      });
      records.push(...pageRecs);
      offset = typeof json?.offset === 'string' ? json.offset : null;

    } while (offset);

    return { records };
  } catch (err) {
    return { records, warning: `[${tableKey}] 예외: ${err.message}` };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (!BASE_ID || !TOKEN) {
    const missing = [!BASE_ID && 'AIRTABLE_BASE_ID', !TOKEN && 'AIRTABLE_API_TOKEN'].filter(Boolean);
    return res.status(500).json({
      error: `환경변수 누락: ${missing.join(', ')}`,
      funds: [], investments: [], lp: [], lpInvestments: [],
      companies: [], financials: [], tips: [], fundFees: [],
    });
  }

  const [fundsR, invR, lpR, lpInvR, coR, finR, tipsR, feeR] = await Promise.all([
    fetchTableSafe('funds'),
    fetchTableSafe('investments'),
    fetchTableSafe('lp'),
    fetchTableSafe('lpInvestments'),
    fetchTableSafe('companies'),
    fetchTableSafe('financials'),
    fetchTableSafe('tips'),
    fetchTableSafe('fundFees'),
  ]);

  const warnings = [fundsR, invR, lpR, lpInvR, coR, finR, tipsR, feeR]
    .filter(r => r.warning).map(r => r.warning);

  res.status(200).json({
    funds:         Array.isArray(fundsR.records)  ? fundsR.records  : [],
    investments:   Array.isArray(invR.records)    ? invR.records    : [],
    lp:            Array.isArray(lpR.records)     ? lpR.records     : [],
    lpInvestments: Array.isArray(lpInvR.records)  ? lpInvR.records  : [],
    companies:     Array.isArray(coR.records)     ? coR.records     : [],
    financials:    Array.isArray(finR.records)    ? finR.records    : [],
    tips:          Array.isArray(tipsR.records)   ? tipsR.records   : [],
    fundFees:      Array.isArray(feeR.records)    ? feeR.records    : [],
    ...(warnings.length > 0 && { warnings }),
  });
}
