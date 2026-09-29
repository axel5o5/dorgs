import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import open from 'open';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const host = '127.0.0.1';
const url = `http://${host}:${port}/`;
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

http
  .createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url ?? '/', url).pathname);
    } catch {
      response.writeHead(400);
      response.end('Bad request\n');
      return;
    }

    if (pathname === '/') pathname = '/index.html';

    const filePath = path.resolve(root, `.${pathname}`);
    if (!filePath.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403);
      response.end('Forbidden\n');
      return;
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    fs.readFile(filePath, function (error, content) {
      if (error) {
        if (error.code === 'ENOENT' || error.code === 'EISDIR') {
          response.writeHead(404, { 'Content-Type': 'text/plain' });
          response.end('Not found\n');
        } else {
          response.writeHead(500);
          response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
        }
      } else {
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content, 'utf-8');
      }
    });
  })
  .listen(port, host, () => {
    console.log(`Server running at ${url}`);
    if (process.env.NO_OPEN !== '1') {
      open(url).catch((error) => console.error(`Unable to open ${url}:`, error));
    }
  });
