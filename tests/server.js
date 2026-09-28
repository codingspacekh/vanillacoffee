// Minimal static server with SPA fallback (client-side routes -> index.html).
// SPA_FALLBACK=false makes it answer routes with 404, like a plain static
// host such as VS Code's Live Server does by default.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = process.env.PORT || 3000;
const spaFallback = process.env.SPA_FALLBACK != "false";
const types = {
    ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".json": "application/json", ".webmanifest": "application/manifest+json",
    ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg",
};

createServer(async (req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (pathname == "/") {
        pathname = "/index.html";
    }
    const file = normalize(join(root, pathname));
    try {
        if (!file.startsWith(root) || !extname(file)) throw new Error("route");
        const body = await readFile(file);
        res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
        res.end(body);
    } catch {
        if (extname(pathname) || !spaFallback) {
            res.writeHead(404, { "Content-Type": "text/html" }).end(`<pre>Cannot GET ${pathname}</pre>`);
        } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(await readFile(join(root, "index.html")));
        }
    }
}).listen(port, () => console.log(`Serving on http://localhost:${port}`));
