
export default function handler(req, res) {
  // 한국 시간 기준 오늘 날짜
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(new Date());

  const date = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      date[part.type] = Number(part.value);
    }
  }

  // 2020년 8월 25일 = D+1
  const start = Date.UTC(2020, 7, 25);
  const today = Date.UTC(
    date.year,
    date.month - 1,
    date.day
  );

  const days = Math.floor(
    (today - start) / 86400000
  ) + 1;

  // 초록색 세잎클로버
  function clover(x, y) {
    return `
      <g transform="translate(${x} ${y})"
         fill="#79A653"
         stroke="#648A43"
         stroke-width="1">
        <circle cx="-7" cy="-6" r="7"/>
        <circle cx="7" cy="-6" r="7"/>
        <circle cx="0" cy="5" r="7"/>
        <path d="M0 9 Q3 17 0 22"
              fill="none"
              stroke="#648A43"
              stroke-width="2"
              stroke-linecap="round"/>
      </g>
    `;
  }

  // 코랄핑크 하트
  function heart(x, y) {
    return `
      <path
        d="M ${x} ${y + 7}
           C ${x - 22} ${y - 6},
             ${x - 10} ${y - 16},
             ${x} ${y - 7}
           C ${x + 10} ${y - 16},
             ${x + 22} ${y - 6},
             ${x} ${y + 7} Z"
        fill="#F28F8F"/>
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="834" height="110"
         viewBox="0 0 834 110">

      <!-- 연두색 배경 -->
      <rect width="834" height="110"
            rx="13" fill="#D6E78A"/>

      <!-- 상단 제목 -->
      <text x="24" y="29"
            font-family="Arial, sans-serif"
            font-size="13"
            font-weight="bold"
            fill="#604329">
        ♥ DANGEL LAND · ANNIVERSARY
      </text>

      <!-- 흰색 전광판 -->
      <rect x="14" y="43"
            width="806" height="54"
            rx="9" fill="#FFFFFF"/>

      <!-- 양쪽 세잎클로버 -->
      ${clover(95, 69)}
      ${clover(739, 69)}

      <!-- 가운데 문구 -->
      <text x="417" y="77"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="20"
            font-weight="bold"
            fill="#604329">
        <tspan>다니엘</tspan>
        <tspan fill="#F28F8F"> ♥ </tspan>
        <tspan>미겔 · 함께한 지 D+${days}</tspan>
      </text>

    </svg>
  `;

  res.setHeader(
    "Content-Type",
    "image/svg+xml; charset=utf-8"
  );

  res.setHeader(
    "Cache-Control",
    "public, max-age=0, s-maxage=300"
  );

  res.status(200).send(svg);
}
