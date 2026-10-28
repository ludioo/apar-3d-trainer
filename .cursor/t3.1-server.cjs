const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const root = path.resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.gz': 'application/gzip' };
http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  let body = fs.readFileSync(file);
  const ext = path.extname(file);
  const headers = { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' };
  if (['.html', '.js', '.css'].includes(ext) && req.headers['accept-encoding']?.includes('gzip')) {
    body = gzipSync(body); headers['Content-Encoding'] = 'gzip';
  }
  headers['Content-Length'] = body.length;
  res.writeHead(200, headers); res.end(body);
}).listen(4191, '0.0.0.0', () => console.log('Audit/QA http://localhost:4191 (text gzip; binary unchanged)'));
