import http, { type IncomingHttpHeaders, type IncomingMessage, type ServerResponse } from "http";
import worker from "./index";
import type { Env } from "./auth";

function getEnv(): Env {
  return {
    API_KEY: process.env.API_KEY,
    RAYCAST_TOKEN: process.env.RAYCAST_TOKEN,
    IMAGE_TOKEN: process.env.IMAGE_TOKEN,
    SIG_SECRET: process.env.SIG_SECRET,
    DEVICE_ID: process.env.DEVICE_ID,
    DEBUG: process.env.DEBUG,
  };
}

function getPort(): number {
  const raw = process.env.PORT || "3000";
  const port = Number.parseInt(raw, 10);
  return Number.isFinite(port) && port > 0 ? port : 3000;
}

function getBaseUrl(req: IncomingMessage): string {
  const host = req.headers.host || `localhost:${getPort()}`;
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  return `${proto}://${host}`;
}

async function readRequestBody(req: IncomingMessage): Promise<Uint8Array | undefined> {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return undefined;
  return Buffer.concat(chunks);
}

function nodeHeadersToFetchHeaders(headers: IncomingHttpHeaders): Headers {
  const result = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) result.append(key, v);
    } else if (typeof value === "string") {
      result.set(key, value);
    }
  }
  return result;
}

async function writeFetchResponseToNode(
  response: Response,
  res: ServerResponse,
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) res.write(Buffer.from(value));
    }
    res.end();
  } finally {
    reader.releaseLock();
  }
}

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const method = req.method || "GET";
    const url = `${getBaseUrl(req)}${req.url || "/"}`;
    const headers = nodeHeadersToFetchHeaders(req.headers);
    const body = await readRequestBody(req);

    const request = new Request(url, {
      method,
      headers,
      body,
      // Node fetch requires duplex when sending a body in non-GET/HEAD requests.
      duplex: "half",
    } as RequestInit);

    const response = await worker.fetch(request, getEnv());
    await writeFetchResponseToNode(response, res);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { message } }));
  }
});

const port = getPort();
server.listen(port, "0.0.0.0", () => {
  console.log(`[INFO] Raycast Relay server listening on 0.0.0.0:${port}`);
});
