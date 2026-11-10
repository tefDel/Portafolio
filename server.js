const { createReadStream } = require("node:fs");
const { stat } = require("node:fs/promises");
const { createServer } = require("node:http");
const path = require("node:path");

const publicDir = path.resolve(__dirname, "public");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".m4v": "video/mp4",
  ".mp4": "video/mp4",
  ".ogg": "video/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
};

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new RangeError(`Invalid PORT: ${process.env.PORT}`);
}

function respondNotFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  try {
    const url = new URL(request.url || "/", "http://localhost");
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === "/") {
      response.writeHead(302, { Location: "/portfolio/" });
      response.end();
      return;
    }

    let filePath = path.resolve(publicDir, `.${pathname}`);
    if (
      filePath !== publicDir &&
      !filePath.startsWith(`${publicDir}${path.sep}`)
    ) {
      respondNotFound(response);
      return;
    }

    let fileInfo;
    try {
      fileInfo = await stat(filePath);
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") {
        respondNotFound(response);
        return;
      }
      throw error;
    }

    if (fileInfo.isDirectory()) {
      if (!pathname.endsWith("/")) {
        response.writeHead(301, { Location: `${pathname}/${url.search}` });
        response.end();
        return;
      }
      filePath = path.join(filePath, "index.html");
      try {
        fileInfo = await stat(filePath);
      } catch (error) {
        if (error.code === "ENOENT" || error.code === "ENOTDIR") {
          respondNotFound(response);
          return;
        }
        throw error;
      }
    }

    if (!fileInfo.isFile()) {
      respondNotFound(response);
      return;
    }

    const rangeHeader = request.headers.range;
    if (fileInfo.size === 0) {
      if (rangeHeader) {
        response.writeHead(416, {
          "Content-Range": "bytes */0",
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end();
        return;
      }
      response.writeHead(200, {
        "Accept-Ranges": "bytes",
        "Content-Length": 0,
        "Content-Type":
          contentTypes[path.extname(filePath).toLowerCase()] ||
          "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      response.end();
      return;
    }

    let start = 0;
    let end = fileInfo.size - 1;
    let statusCode = 200;

    if (rangeHeader) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      if (!match || (!match[1] && !match[2])) {
        response.writeHead(416, {
          "Content-Range": `bytes */${fileInfo.size}`,
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end();
        return;
      }

      if (!match[1]) {
        const suffixLength = Number(match[2]);
        if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
          response.writeHead(416, {
            "Content-Range": `bytes */${fileInfo.size}`,
            "Content-Type": "text/plain; charset=utf-8",
          });
          response.end();
          return;
        }
        start = Math.max(fileInfo.size - suffixLength, 0);
      } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : fileInfo.size - 1;
      }

      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start >= fileInfo.size ||
        start > end
      ) {
        response.writeHead(416, {
          "Content-Range": `bytes */${fileInfo.size}`,
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end();
        return;
      }

      end = Math.min(end, fileInfo.size - 1);
      statusCode = 206;
    }

    const responseHeaders = {
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type":
        contentTypes[path.extname(filePath).toLowerCase()] ||
        "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    };
    if (statusCode === 206) {
      responseHeaders["Content-Range"] =
        `bytes ${start}-${end}/${fileInfo.size}`;
    }
    response.writeHead(statusCode, responseHeaders);

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    const stream = createReadStream(filePath, { start, end });
    stream.on("error", (error) => {
      console.error(`Failed to serve ${filePath}:`, error);
      response.destroy(error);
    });
    stream.pipe(response);
  } catch (error) {
    if (error instanceof URIError) {
      response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Bad request");
      return;
    }
    console.error("Failed to handle request:", error);
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Internal server error");
    } else {
      response.destroy(error);
    }
  }
});

server.on("error", (error) => {
  console.error(`Could not start the local server on ${host}:${port}:`, error);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Portfolio available at http://localhost:${port}`);
});
