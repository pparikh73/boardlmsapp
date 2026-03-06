const fs = require('fs');
const path = require('path');

const PWA_TAGS = `<link rel="manifest" href="/manifest.json" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /><meta name="apple-mobile-web-app-title" content="Board Academy" /><meta name="theme-color" content="#1694d1" />`;

function patchHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('rel="manifest"')) return;
  html = html.replace('</head>', PWA_TAGS + '</head>');
  fs.writeFileSync(filePath, html);
  console.log('Patched:', filePath);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) patchHtml(full);
  }
}

walk(path.join(__dirname, '../dist'));
