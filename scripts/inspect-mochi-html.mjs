import { readFileSync } from "node:fs";

const html = readFileSync("C:/Users/ACER/Downloads/mochi.html", "utf8");
console.log("Length:", html.length);
const titleMatch = html.match(/<title>(.*?)<\/title>/i);
console.log("Title:", titleMatch ? titleMatch[1] : "No title");

// Search for keywords from the image:
const keywords = [
  "Moonlight Promise",
  "Tối nay xem gì",
  "Bình Minh Ở Nơi Xa",
  "Tiệm Cà Phê Những Giấc Mơ",
  "Ánh Sao Trong Tim",
  "LIFE IS BETTER",
  "Good Movies",
  "Phim hay",
  "Watch Party",
];

for (const kw of keywords) {
  console.log(`Keyword "${kw}": ${html.includes(kw)}`);
}
