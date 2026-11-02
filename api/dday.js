
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import GIFEncoder from "gif-encoder-2";

const WIDTH = 834;
const HEIGHT = 110;

let assetsPromise;

// 일반 한글 폰트와 세잎클로버 불러오기
async function getAssets() {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      const fontUrl =
        "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf";

      const cloverUrl =
        "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2618.png";

      const [fontResponse, cloverResponse] =
        await Promise.all([
          fetch(fontUrl),
          fetch(cloverUrl)
        ]);

      if (!fontResponse.ok) {
        throw new Error("한글 폰트 다운로드 실패");
      }

      if (!cloverResponse.ok) {
        throw new Error("세잎클로버 다운로드 실패");
      }

      const fontBuffer = Buffer.from(
        await fontResponse.arrayBuffer()
      );

      const cloverBuffer = Buffer.from(
        await cloverResponse.arrayBuffer()
      );

      // 이전 오류 수정: registerFromBuffer 대신 register
      const registered = GlobalFonts.register(
        fontBuffer,
        "CafeFont"
      );

      if (!registered) {
        throw new Error("한글 폰트 등록 실패");
      }

      return {
        cloverImage: await loadImage(cloverBuffer)
      };
    })().catch(error => {
      assetsPromise = null;
      throw error;
    });
  }

  return assetsPromise;
}

// 한국 날짜 기준 D+ 계산
function getDays() {
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

  const start = Date.UTC(2020, 7, 25);

  const today = Date.UTC(
    date.year,
    date.month - 1,
    date.day
  );

  return Math.floor(
    (today - start) / 86400000
  ) + 1;
}

// 둥근 사각형
function rounded(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// GIF 생성
export default async function handler(req, res) {
  try {
    const { cloverImage } = await getAssets();
    const days = getDays();

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    const encoder = new GIFEncoder(
      WIDTH,
      HEIGHT,
      "octree"
    );

    encoder.setRepeat(0);
    encoder.setDelay(180);
    encoder.start();

    const leftText = "다니엘 ";
    const rightText =
      ` 미겔 · 함께한 지 D+${days}`;

    const font = 'bold 20px "CafeFont"';

    ctx.font = font;

    const leftWidth =
      ctx.measureText(leftText).width;

    const rightWidth =
      ctx.measureText(rightText).width;

    const contentWidth =
      25 + 12 +
      leftWidth + 24 +
      rightWidth + 12 + 25;

    const frameCount = 36;

    for (let i = 0; i < frameCount; i++) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // 연두색 배경
      rounded(
        ctx,
        0, 0, WIDTH, HEIGHT,
        13,
        "#D6E78A"
      );

      // 상단 제목
      ctx.fillStyle = "#604329";
      ctx.font = 'bold 13px Arial';
      ctx.fillText(
        "♥ DANGEL LAND · ANNIVERSARY",
        24, 29
      );

      // 흰색 전광판
      rounded(
        ctx,
        14, 43, 806, 54,
        9,
        "#FFFFFF"
      );

      // 움직이는 영역 제한
      ctx.save();
      ctx.beginPath();
      ctx.rect(14, 43, 806, 54);
      ctx.clip();

      const distance =
        WIDTH + contentWidth + 40;

      let x =
        WIDTH - (i / frameCount) * distance;

      // 왼쪽 세잎클로버
      ctx.drawImage(
        cloverImage,
        x, 57, 25, 25
      );

      x += 37;

      // 다니엘
      ctx.font = font;
      ctx.fillStyle = "#604329";
      ctx.fillText(leftText, x, 77);

      x += leftWidth;

      // 코랄핑크 하트
      ctx.font = "bold 23px Arial";
      ctx.fillStyle = "#F28F8F";
      ctx.fillText("♥", x, 78);

      x += 24;

      // 미겔 + 디데이
      ctx.font = font;
      ctx.fillStyle = "#604329";
      ctx.fillText(rightText, x, 77);

      x += rightWidth + 12;

      // 오른쪽 세잎클로버
      ctx.drawImage(
        cloverImage,
        x, 57, 25, 25
      );

      ctx.restore();

      // 프레임 추가
      encoder.addFrame(ctx);
    }

    encoder.finish();

    res.setHeader(
      "Content-Type",
      "image/gif"
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=3600"
    );

    res.status(200).send(
      Buffer.from(encoder.out.getData())
    );

  } catch (error) {
    console.error(error);

    res.status(500).send(
      "GIF generation failed: " + error.message
    );
  }
}
