// index.html / style.css / data.js / app.js を1ファイルにまとめる
//   public/index.html   … Cloudflare で公開するページ
//   dist/pokesleep.html … claude.ai の Artifact 用（<html>/<head> なし）
const fs = require("fs");
const read = (f) => fs.readFileSync(f, "utf8");
const html = read("index.html");
const body = html.match(/<body>([\s\S]*?)<script src="data.js">/)[1].trim();
const fontLink = html.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]*>/)[0];
const style = `<style>\n${read("style.css")}\n</style>`;
const script = `<script>\n${read("data.js")}\n${read("app.js")}\n</script>`;

const site = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="手持ちの食材の数を入れると、ポケモンスリープで今作れる料理と、あと何個で作れるかを表示します。">
<title>ポケスリ料理判定</title>
${fontLink}
${style}
</head>
<body>
${body}
${script}
</body>
</html>
`;
const artifact = `<title>ポケスリ料理判定</title>\n${fontLink}\n${style}\n${body}\n${script}\n`;

fs.mkdirSync("public", { recursive: true });
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("public/index.html", site);
fs.writeFileSync("dist/pokesleep.html", artifact);
if (fs.existsSync("images")) fs.cpSync("images", "public/images", { recursive: true });
console.log("built public/index.html, dist/pokesleep.html");
