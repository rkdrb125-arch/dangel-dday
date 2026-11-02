
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import GIFEncoder from "gif-encoder-2";

const WIDTH = 834;
const HEIGHT = 110;

let assetsPromise;

async function getAssets() {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      // 일반 한글 글꼴: Noto Sans KR
      const fontUrl =
        "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf";

      // 세잎클로버 이모지 이미지
      const cloverUrl =
        "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2618.png";

      const [fontResponse, cloverResponse] =
        await Promise.all([
          fetch(fontUrl),
          fetch(cloverUrl)
        ]);

      if (!fontResponse.ok) {
        throw new Error("한글 폰트를 불러오지 못했습니다.");
      }

      if (!cloverResponse.ok) {
        throw new Error("클로버를 불러오지 못했습니다.");
      }

      const fontBuffer = Buffer.from(
        await fontResponse.arrayBuffer()
      );

      const cloverBuffer = Buffer.from(
        await cloverResponse.arrayBuffer()
      );

      const registered = GlobalFonts.registerFromBuffer(
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

function rounded(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export default async function handler(req, res) {
  try {
    const { cloverImage } = await getAssets();
    const days = getDays();

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    const encoder = new GIFEncoder(
      WIDTH, HEIGHT, "octree"
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
      25 + 12 + leftWidth + 24 +
      rightWidth + 12 + 25;

    for (let i = 0; i < 36; i++) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      rounded(
        ctx, 0, 0, WIDTH, HEIGHT,
        13, "#D6E78A"
      );

      ctx.fillStyle = "#604329";
      ctx.font = 'bold 13px Arial';
      ctx.fillText(
        "♥ DANGEL LAND · ANNIVERSARY",
        24, 29
      );

      rounded(
        ctx, 14, 43, 806, 54,
        9, "#FFFFFF"
      );

      ctx.save();
      ctx.beginPath();
      ctx.rect(14, 43, 806, 54);
      ctx.clip();

      const distance =
        WIDTH + contentWidth + 40;

      let x =
        WIDTH - (i / 36) * distance;

      ctx.drawImage(
        cloverImage, x, 57, 25, 25
      );
      x += 37;

      ctx.font = font;
      ctx.fillStyle = "#604329";
      ctx.fillText(leftText, x, 77);
      x += leftWidth;

      ctx.font = "bold 23px Arial";
      ctx.fillStyle = "#F28F8F";
      ctx.fillText("♥", x, 78);
      x += 24;

      ctx.font = font;
      ctx.fillStyle = "#604329";
      ctx.fillText(rightText, x, 77);
      x += rightWidth + 12;

      ctx.drawImage(
        cloverImage, x, 57, 25, 25
      );

      ctx.restore();
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
