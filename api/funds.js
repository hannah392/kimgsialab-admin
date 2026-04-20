
export const config = { runtime: 'edge' };

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN   = process.env.AIRTABLE_API_TOKEN;

async function fetchAll(tableId, fields) {
  const records = [];
  let offset = null;
  do {
    const params = new URLSearchParams({ pageSize: '100', fields });
    if (offset) params.set('offset', offset);
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${tableId}?${params}`,
      { headers: { Authorization: `Bearer ${TOKEN}` }, cache: 'no-store' }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Airtable error');
    records.push(...(json.records || []));
    offset = json.offset || null;
  } while (offset);
  return records;
}

export default async function handler(req) {
  try {
    // 조합 테이블
    const fundRecs = await fetchAll('tbl4kTjRXBfZZqkkb', [
      'fldV6OIb0N1NjJPGX', // 펀드명
      'fldyBig7rN3L4zJlF', // 고유번호(bizno)
      'fldMhhjs5UruVxbWa', // 설립일
      'fldi4uHcBCs9AO8FT', // 해산일(만기)
      'fldtDF2gEA28ZLZhW', // 경과일
      'fldzoFd7iVY7yiPPK', // 펀드 규모(amount)
      'fldnuy2hJjWTiN6Nm', // 투자 금액(paid 롤업)
      'fldmkTRlWMKqtVTzb', // 투자 건수
    ]);

    // 투자(Investments) 테이블
    const invRecs = await fetchAll('tblTWqFmJPHcUaKcl', [
      'fldaLQL0asyBs12XS', // 투자 상세 ID (no)
      'fldKgHckkom7BzziQ', // 회사명
      'fldZWbiEpbk8DXzQ3', // 조합명(linked)
      'fldsQPreuTgF1qMMl', // 투자 종류
      'fldAc2Zvntn9pIIIk', // 투자일
      'fldQQgAjQPCMLo2iQ', // 투자금
      'fldxuYZbp322jb7r6', // 최신 밸류
      'fldmtLTqZtMqndSHi', // 상태
    ]);

    // LP 테이블
    const lpRecs = await fetchAll('tbluuk5qttawnZk1k', [
      'fldOZaZAlqvgE6nZd', // 이름
      'fldZKMiXmuXDJAT02', // 유형
      'fld3oP1yE6ggCK7dO', // 납입 금액(rollup)
    ]);

    // LP 출자 테이블
    const lpInvRecs = await fetchAll('tbl3ruORr95LGhLk3', [
      'fldqeRWPBSGYi2nvQ', // 이름
      'fldR4UKRBuV5UyJpy', // 펀드(linked)
      'fldrqN5GrwUwgAiLk', // 상태
      'fldie2X4997OydZOu', // 약정 금액
      'fldbUrAlfUiq9NWv4', // 회차
      'fldJbdpDgT3xg8l2v', // 납입 금액
      'fld9ajRSMny7vLRzj', // 납입일
    ]);

    // 회사(Companies) 테이블
    const companyRecs = await fetchAll('tblSAuedQ2O7w9mvd', [
      'fldgvMHmMUvjzkNtK', // 회사명
      'fldRILTx5SzS5ifLz', // 대표자
      'fldfkh29dbKxG5jeX', // 사업자등록번호
      'fldBfGloifB0ovXA2', // 법인 설립일
      'fldaXqn7XHnIoECly', // 연락처
      'fldrO3QIWyUTcL6xb', // 이메일
      'fldMASYU2jSD1SofT', // 홈페이지
    ]);

    // 결산/재무 테이블
    const finRecs = await fetchAll('tblBxAkCLGurQjFBC', [
      'fldDOI9NhZqzYwQFw', // 회사명(linked)
      'fldVPLgQVAspyS7wR', // 기준 연도
      'fld4Z9N1VkrFLKsyK', // 자본 총액
      'flddSGbYqYC9QnqOY', // 부채 총액
      'fld9VsXIPmAVIpYsj', // 매출액
      'flddTOGVyVVdIiWGc', // 당기순이익
    ]);

    // TIPS 테이블
    const tipsRecs = await fetchAll('tblA6DmgfLifpIpC4', [
      'fldU0AYnq3LOL3ZX6', // 회사명
      'fld0xgv3qOKp3ME7i', // 협약 시작
      'fldxFpLI6w1aUqJOe', // 협약 종료
      'fldy8ZvjAfmD3LUd8', // 상태
      'fldyyYuGa75wzE3Gf', // 과제명
    ]);

    return new Response(JSON.stringify({
      funds: fundRecs,
      investments: invRecs,
      lp: lpRecs,
      lpInvestments: lpInvRecs,
      companies: companyRecs,
      financials: finRecs,
      tips: tipsRecs,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
