
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

  // 2020년 8월 25일을 D+1로 계산
  const start = Date.UTC(2020, 7, 25);

  const today = Date.UTC(
    date.year,
    date.month - 1,
    date.day
  );

  const days =
    Math.floor((today - start) / 86400000) + 1;

  // 움직이는 디데이 전광판
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="834"
         height="110"
         viewBox="0 0 834 110">

      <!-- 연두색 배경 -->
      <rect width="834"
            height="110"
            rx="13"
            fill="#D6E78A"/>

      <!-- 상단 제목 -->
      <text x="24"
            y="29"
            font-family="Arial, sans-serif"
            font-size="13"
            font-weight="bold"
            fill="#604329">
        ♥ DANGEL LAND · ANNIVERSARY
      </text>

      <!-- 흰색 전광판 -->
      <rect x="14"
            y="43"
            width="806"
            height="54"
            rx="9"
            fill="#FFFFFF"/>

      <!-- 움직이는 영역 -->
      <defs>
        <clipPath id="tickerClip">
          <rect x="14"
                y="43"
                width="806"
                height="54"
                rx="9"/>
        </clipPath>
      </defs>

      <!-- 오른쪽에서 왼쪽으로 이동 -->
      <g clip-path="url(#tickerClip)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            from="850 0"
            to="-650 0"
            dur="15s"
            repeatCount="indefinite"/>

          <text x="0"
                y="77"
                font-family="Arial, sans-serif"
                font-size="20"
                font-weight="bold"
                fill="#604329">

            <tspan>☘️ 다니엘 </tspan>

            <tspan fill="#F28F8F">♥</tspan>

            <tspan>
              미겔 · 함께한 지 D+${days} ☘️
            </tspan>

          </text>
        </g>
      </g>

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
