import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const path = decodeURIComponent(url.pathname === "/" ? "/demo/index.html" : url.pathname);
    const file = resolve(root, "." + path);
    if (!file.startsWith(root + sep) || path.split("/").some(part => part.startsWith("."))) {
      response.writeHead(403).end(); return;
    }
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", types[extname(file)] || "text/plain");
    response.end(await readFile(file));
  } catch { response.writeHead(404).end("Not found"); }
}).listen(port, "127.0.0.1", () => console.log("Demo: http://127.0.0.1:" + port));
