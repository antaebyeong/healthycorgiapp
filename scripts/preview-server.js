const http = require("http");

const base = (kicker, title, copy) => `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    body{margin:0;background:#fff7e8;color:#2d241c;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
    .wrap{max-width:430px;margin:0 auto;min-height:100vh;padding:40px 24px;box-sizing:border-box}
    .kicker{color:#8b5a2b;font-weight:800;font-size:14px}
    .title{font-size:42px;line-height:1.05;margin:10px 0 14px;font-weight:900}
    .copy{color:#8b5a2b;line-height:1.7}
    .grid{display:grid;gap:12px;margin-top:30px}
    .card,.primary{display:block;border-radius:12px;padding:17px 18px;text-decoration:none;font-weight:800}
    .primary{background:#8b5a2b;color:white;box-shadow:0 16px 40px rgba(139,90,43,.14)}
    .card{background:white;color:#8b5a2b;border:1px solid #e8a85d}
  </style>
</head>
<body>
  <main class="wrap">
    <p class="kicker">${kicker}</p>
    <h1 class="title">${title}</h1>
    <p class="copy">${copy}</p>
    <div class="grid">
      <a class="primary" href="/home">홈 화면 보기</a>
      <a class="card" href="/login">로그인</a>
      <a class="card" href="/signup">가입 신청</a>
      <a class="card" href="/setup-admin">최초 관리자 생성</a>
    </div>
  </main>
</body>
</html>`;

const pages = {
  "/": base("운동 인증 동아리 PWA", "헬시코기", "사진으로 운동을 인증하고, 이번 주 4회 달성 여부를 가볍게 확인하세요."),
  "/home": base("오늘도 건강하게", "헬시코기", "사진 인증하기, 내 출석 현황, 전체 인증 피드, 공지와 노션 링크가 들어갈 홈 화면입니다."),
  "/login": base("회원 및 운영진", "로그인", "이름, 생년월일, 관리자 코드는 다음 단계 API에서 서버 검증으로 연결됩니다."),
  "/signup": base("가입 신청", "가입 신청", "동명이인 방지를 위해 이름과 생년월일 조합 중복 가입은 차단됩니다."),
  "/setup-admin": base("초기 설정", "최초 관리자 생성", "role=admin 계정이 0명일 때만 관리자 코드 검증 후 생성됩니다.")
};

http.createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(pages[path] || pages["/"]);
}).listen(3000, "127.0.0.1");
