const fs = require('fs');
const path = require('path');

const ID = process.env.BASIC_AUTH_ID || 'kimgisalab';
const PW = process.env.BASIC_AUTH_PW || '여기에비밀번호';

export default function handler(req, res) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="kimgisalab"');
    return res.status(401).send('인증이 필요합니다');
  }

  const base64 = authHeader.split(' ')[1];
  const [id, pw] = Buffer.from(base64, 'base64').toString().split(':');

  if (id !== ID || pw !== PW) {
    res.setHeader('WWW-Authenticate', 'Basic realm="kimgisalab"');
    return res.status(401).send('인증 실패');
  }

  // 인증 통과 → index.html 서빙
  const html = fs.readFileSync(path.join(process.cwd(), 'public', 'index.html'), 'utf-8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
