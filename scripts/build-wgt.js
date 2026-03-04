// .wgt paketi oluşturur.
// public/index.html'i kaynak alır; BASE_URL enjekte ederek Tizen projesi üzerinden paketler.
// Kullanım: node scripts/build-wgt.js <base-url> [profile]
// Örnek:    node scripts/build-wgt.js https://octopus-signage-player-production.up.railway.app octopus-dev

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PUBLIC_INDEX = path.join(ROOT, 'public', 'index.html');   // tek kaynak
const TIZEN_PROJECT = path.join(ROOT, 'Tizen');                 // Tizen Studio projesi
const PROJECT_INDEX = path.join(TIZEN_PROJECT, 'index.html');
const DIST_DIR = path.join(ROOT, 'dist');

const baseUrl = process.argv[2] || null;
const profile = process.argv[3] || 'octopus-dev';

if (!baseUrl) {
  console.error('Usage: node scripts/build-wgt.js <base-url> [profile]');
  process.exit(1);
}

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 1) public/index.html'i oku
let content = fs.readFileSync(PUBLIC_INDEX, 'utf8');

// 2) <script> bloğunun başına BASE_URL değişkenini enjekte et
content = content.replace(
  /(<script>)\s*\n/,
  `$1\n    var BASE_URL = '${baseUrl}';\n\n`,
);

// 3) Relative URL'leri absolute yap (Tizen wgt:// origin'den çalışır)
content = content.replace(/fetch\('\/api\//g, "fetch(BASE_URL + '/api/");
content = content.replace(/fetch\("\/api\//g, 'fetch(BASE_URL + "/api/');
content = content.replace(/new EventSource\('\/events'\)/g, "new EventSource(BASE_URL + '/events')");
content = content.replace(/new EventSource\("\/events"\)/g, 'new EventSource(BASE_URL + "/events")');

// 4) Tizen projesindeki index.html'i güncelle
fs.writeFileSync(PROJECT_INDEX, content, 'utf8');
console.log(`Updated Tizen/index.html  (source: public/index.html, BASE_URL → ${baseUrl})`);

// 5) Tizen CLI ile paketle
const cmd = `tizen package -t wgt -s "${profile}" -o "${DIST_DIR}" -- "${TIZEN_PROJECT}"`;
console.log(cmd);
execSync(cmd, { stdio: 'inherit' });

console.log('\nWGT ready in dist/');
