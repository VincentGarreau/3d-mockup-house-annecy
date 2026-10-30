// Serveur statique minimal pour Railway : sert index.html (maquette 3D du duplex).
// Protection optionnelle : définir la variable BASIC_AUTH="utilisateur:motdepasse" dans Railway.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const AUTH = process.env.BASIC_AUTH || '';
const html = fs.readFileSync(path.join(__dirname, 'index.html'));
const gz = zlib.gzipSync(html);

http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200); return res.end('ok'); }
  if (AUTH) {
    const h = req.headers.authorization || '';
    const ok = h.startsWith('Basic ') && Buffer.from(h.slice(6), 'base64').toString() === AUTH;
    if (!ok) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Maquette duplex"' }); return res.end('Authentification requise'); }
  }
  if (req.url.startsWith('/vendor/')) {                       // three.js embarqué (pas de dépendance au CDN)
    const f = path.normalize(path.join(__dirname, decodeURIComponent(req.url.split('?')[0])));
    if (!f.startsWith(path.join(__dirname, 'vendor') + path.sep) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable' });
    return fs.createReadStream(f).pipe(res);
  }
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Robots-Tag': 'noindex, nofollow' };
  if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) { res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip' }); return res.end(gz); }
  res.writeHead(200, headers); res.end(html);
}).listen(PORT, () => console.log(`Maquette en ligne sur le port ${PORT}`));
