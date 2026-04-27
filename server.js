const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = 8085;
const HOST = '0.0.0.0';
const DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // POST /shutdown — localhost only
  if (req.method === 'POST' && req.url === '/shutdown') {
    const ip = req.socket.remoteAddress;
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Shutting down...');
      console.log('Shutdown requested. Bye.');
      server.close(() => process.exit(0));
    } else {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
    }
    return;
  }

  // Static file serving
  let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  filePath = decodeURIComponent(filePath);

  // Prevent directory traversal
  if (!filePath.startsWith(DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain' });
      res.end(err.code === 'ENOENT' ? '404 Not Found' : '500 Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

function getLocalUrls() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => `http://${net.address}:${PORT}/`);
}

server.listen(PORT, HOST, () => {
  console.log(`\n  ⛰️  快晴キープ判定サーバー起動`);
  console.log(`  → PC: http://localhost:${PORT}/`);
  for (const url of getLocalUrls()) {
    console.log(`  → スマホ/同一LAN: ${url}`);
  }
  console.log(`  停止: curl -X POST http://localhost:${PORT}/shutdown\n`);
});
