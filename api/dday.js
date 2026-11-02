
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import GIFEncoder from "gif-encoder-2";

const WIDTH = 834;
const HEIGHT = 110;

let assetsPromise;

async function getAssets() {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      // 일반 한글 글씨체
      const fontUrl =
        "https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-Regular.ttf";

      // 실제 세잎클로버 이모지 그림
      const cloverUrl =
        "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2618.png";

      const [fontRes, cloverRes] = await Promise.all([
        fetch(fontUrl),
        fetch(cloverUrl)
      ]);

      if (!fontRes.ok || !cloverRes.ok) {
        throw new Error("폰트 또는 클로버 다운로드 실패");
      }

      const font = Buffer.from(await fontRes.arrayBuffer());
      const clover = Buffer.from(await cloverRes.arrayBuffer());

      GlobalFonts.registerFromBuffer(font, "CafeKorean");

      return {
        cloverImage: await loadImage(clover)
      };
    })().catch(error => {
      assetsPromise = null;
      throw error;
    });
  }

  return assetsPromise;
}

function todayKST() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(new Date());

  const d = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      d[part.type] = Number(part.value);
    }
  }

  return Date.UTC(d.year, d.month - 1, d.day);
}

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

export default async function handler(req, res) {
  try {
    const { cloverImage } = await getAssets();

    const start = Date.UTC(2020, 7, 25);
    const days = Math.floor(
      (todayKST() - start) / 86400000
    ) + 1;

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    const encoder = new GIFEncoder(
      WIDTH, HEIGHT, "octree"
    );

    encoder.setRepeat(0);
    encoder.setDelay(180);
    encoder.start();

    const left = "다니엘 ";
    const right = ` 미겔 · 함께한 지 D+${days}`;

    ctx.font = 'bold 20px "CafeKorean"';

    const leftWidth = ctx.measureText(left).width;
    const rightWidth = ctx.measureText(right).width;

    const heartWidth = 24;
    const cloverSize = 25;
    const gap = 12;

    const textWidth =
      cloverSize + gap +
      leftWidth + heartWidth + rightWidth +
      gap + cloverSize;

    const frames = 36;

    for (let i = 0; i < frames; i++) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // 연두색 배경
      roundRect(
        ctx, 0, 0, WIDTH, HEIGHT, 13,
        "#D6E78A"
      );

      // 상단 제목
      ctx.fillStyle = "#604329";
      ctx.font = 'bold 13px "CafeKorean"';
      ctx.fillText(
        "♥ DANGEL LAND · ANNIVERSARY",
        24, 29
      );

      // 흰색 전광판
      roundRect(
        ctx, 14, 43, 806, 54, 9,
        "#FFFFFF"
      );

      // 움직이는 내용은 흰색 영역 안에서만 표시
      ctx.save();
      ctx.beginPath();
      ctx.rect(14, 43, 806, 54);
      ctx.clip();

      const travel = WIDTH + textWidth + 40;
      let x = WIDTH - (i / frames) * travel;

      // 왼쪽 세잎클로버
      ctx.drawImage(cloverImage, x, 57, 25, 25);
      x += cloverSize + gap;

      // 다니엘
      ctx.font = 'bold 20px "CafeKorean"';
      ctx.fillStyle = "#604329";
      ctx.fillText(left, x, 77);
      x += leftWidth;

      // 코랄핑크 하트
      ctx.fillStyle = "#F28F8F";
      ctx.font = "bold 23px Arial";
      ctx.fillText("♥", x, 78);
      x += heartWidth;

      // 미겔과 디데이
      ctx.font = 'bold 20px "CafeKorean"';
      ctx.fillStyle = "#604329";
      ctx.fillText(right, x, 77);
      x += rightWidth + gap;

      // 오른쪽 세잎클로버
      ctx.drawImage(cloverImage, x, 57, 25, 25);

      ctx.restore();

      encoder.addFrame(ctx);
    }

    encoder.finish();

    res.setHeader("Content-Type", "image/gif");
    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=3600"
    );

    res.status(200).send(
      Buffer.from(encoder.out.getData())
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("GIF generation failed");
  }
}
