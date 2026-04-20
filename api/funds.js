export const config = { runtime: 'edge' };

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN   = process.env.AIRTABLE_API_TOKEN;

// ─────────────────────────────────────────────────────
// 테이블 ID (tbl...) — 이름이 아닌 ID를 사용하므로 한글/영어 무관
// ─────────────────────────────────────────────────────
const TABLES = {
  funds:         'tbl4kTjRXBfZZqkkb',  // 시트명: 조합
  investments:   'tblTWqFmJPHcUaKcl',  // 시트명: 투자 (Investments)
  lp:            'tbluuk5qttawnZk1k',  // 시트명: LP
  lpInvestments: 'tbl3ruORr95LGhLk3',  // 시트명: LP 출자
  companies:     'tblSAuedQ2O7w9mvd',  // 시트명: 회사 (Companies)
  financials:    'tblBxAkCLGurQjFBC',  // 시트명: 결산/재무
  tips:          'tblA6DmgfLifpIpC4',  // 시트명: TIPS
};

const FIELDS = {
  funds:         ['fldV6OIb0N1NjJPGX','fldyBig7rN3L4zJlF','fldMhhjs5UruVxbWa','fldi4uHcBCs9AO8FT','fldzoFd7iVY7yiPPK','fldnuy2hJjWTiN6Nm','fldmkTRlWMKqtVTzb'],
  investments:   ['fldaLQL0asyBs12XS','fldKgHckkom7BzziQ','fldZWbiEpbk8DXzQ3','fldsQPreuTgF1qMMl','fldAc2Zvntn9pIIIk','fldQQgAjQPCMLo2iQ','fldxuYZbp322jb7r6','fldmtLTqZtMqndSHi'],
  lp:            ['fldOZaZAlqvgE6nZd','fldZKMiXmuXDJAT02','fld3oP1yE6ggCK7dO'],
  lpInvestments: ['fldqeRWPBSGYi2nvQ','fldR4UKRBuV5UyJpy','fldrqN5GrwUwgAiLk','fldie2X4997OydZOu','fldbUrAlfUiq9NWv4','fldJbdpDgT3xg8l2v','fld9ajRSMny7vLRzj'],
  companies:     ['fldgvMHmMUvjzkNtK','fldRILTx5SzS5ifLz','fldfkh29dbKxG5jeX','fldBfGloifB0ovXA2','fldaXqn7XHnIoECly','fldrO3QIWyUTcL6xb','fldMASYU2jSD1SofT'],
  financials:    ['fldDOI9NhZqzYwQFw','fldVPLgQVAspyS7wR','fld4Z9N1VkrFLKsyK','flddSGbYqYC9QnqOY','fld9VsXIPmAVIpYsj','flddTOGVyVVdIiWGc'],
  tips:          ['fldU0AYnq3LOL3ZX6','fld0xgv3qOKp3ME7i','fldxFpLI6w1aUqJOe','fldy8ZvjAfmD3LUd8','fldyyYuGa75wzE3Gf'],
};

// URL 직접 조립 — Edge runtime에서 URLSearchParams fields[] 인코딩 문제 우회
function buildUrl(tableId, fields, offset) {
  const fieldStr  = fields.map(f => `fields%5B%5D=${f}`).join('&');
  const offsetStr = offset ? `&offset=${encodeURIComponent(offset)}` : '';
  return `https://api.airtable.com/v0/${BASE_ID}/${tableId}?pageSize=100&${fieldStr}${offsetStr}`;
}

// 단일 테이블 전체 조회 — 절대 throw 안 함, 항상 { records, warning? } 반환
async function fetchTableSafe(tableKey) {
  const tableId = TABLES[tableKey];
  const fields  = FIELDS[tableKey];
  if (!tableId || !fields) return { records: [], warning: `설정 없음: ${tableKey}` };

  const records = [];
  let offset = null;
  let page   = 0;

  try {
    do {
      if (++page > 50) { records.push(); break; } // 무한루프 방어

      const url = buildUrl(tableId, fields, offset);
      let res;

      try {
        res = await fetch(url, {
          headers: { Authorization: `Bearer ${TOKEN}` },
          cache: 'no-store',
        });
      } catch (netErr) {
        return { records, warning: `[${tableKey}] 네트워크 오류: ${netErr.message}` };
      }

      // ★ 핵심 수정: text()로 한 번만 읽고 JSON.parse — Edge에서 body 스트림 소진 방지
      let body;
      try {
        body = await res.text();
      } catch (readErr) {
        return { records, warning: `[${tableKey}] 응답 읽기 실패: ${readErr.message}` };
      }

      if (!body || body.trim() === '') {
        return { records, warning: `[${tableKey}] 빈 응답 (status ${res.status})` };
      }

      let json;
      try {
        json = JSON.parse(body);
      } catch {
        return { records, warning: `[${tableKey}] JSON 파싱 실패 (status ${res.status}): ${body.slice(0, 300)}` };
      }

      if (!res.ok) {
        const msg = json?.error?.message || json?.error?.type || `HTTP ${res.status}`;
        return { records, warning: `[${tableKey}] Airtable 오류: ${msg}` };
      }

      const pageRecs = Array.isArray(json?.records) ? json.records : [];
      records.push(...pageRecs);
      offset = typeof json?.offset === 'string' ? json.offset : null;

    } while (offset);

    return { records };

  } catch (err) {
    return { records, warning: `[${tableKey}] 예외: ${err.message}` };
  }
}

export default async function handler(req) {
  // 환경변수 체크
  if (!BASE_ID || !TOKEN) {
    const missing = [!BASE_ID && 'AIRTABLE_BASE_ID', !TOKEN && 'AIRTABLE_API_TOKEN'].filter(Boolean);
    return new Response(JSON.stringify({
      error: `환경변수 누락: ${missing.join(', ')}`,
      funds: [], investments: [], lp: [], lpInvestments: [],
      companies: [], financials: [], tips: [],
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // 7개 테이블 병렬 조회
  const [fundsR, invR, lpR, lpInvR, coR, finR, tipsR] = await Promise.all([
    fetchTableSafe('funds'),
    fetchTableSafe('investments'),
    fetchTableSafe('lp'),
    fetchTableSafe('lpInvestments'),
    fetchTableSafe('companies'),
    fetchTableSafe('financials'),
    fetchTableSafe('tips'),
  ]);

  const warnings = [fundsR, invR, lpR, lpInvR, coR, finR, tipsR]
    .filter(r => r.warning)
    .map(r => r.warning);

  // 항상 200, 각 키 최소 [] 보장
  return new Response(JSON.stringify({
    funds:         Array.isArray(fundsR.records)  ? fundsR.records  : [],
    investments:   Array.isArray(invR.records)    ? invR.records    : [],
    lp:            Array.isArray(lpR.records)     ? lpR.records     : [],
    lpInvestments: Array.isArray(lpInvR.records)  ? lpInvR.records  : [],
    companies:     Array.isArray(coR.records)     ? coR.records     : [],
    financials:    Array.isArray(finR.records)    ? finR.records    : [],
    tips:          Array.isArray(tipsR.records)   ? tipsR.records   : [],
    ...(warnings.length > 0 && { warnings }),
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
