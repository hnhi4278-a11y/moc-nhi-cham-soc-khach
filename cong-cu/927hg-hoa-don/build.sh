#!/bin/sh
# Tạo bookmarklet từ hoa-don-927.js: bookmarklet.txt (dán vào URL dấu trang) + cai-dat.html (kéo nút lên thanh dấu trang)
set -e
cd "$(dirname "$0")"
npx -y terser@5.31.0 hoa-don-927.js -c -m --ecma 2020 -o .min.js
node -e '
const fs=require("fs");const b="javascript:"+encodeURIComponent(fs.readFileSync(".min.js","utf8").trim());
fs.writeFileSync("bookmarklet.txt",b+"\n");
const h=fs.readFileSync("cai-dat.template.html","utf8").replace("__HREF__",b.replace(/&/g,"&amp;").replace(/"/g,"&quot;"));
fs.writeFileSync("cai-dat.html",h);console.log("bookmarklet:",b.length,"ký tự");'
rm -f .min.js
