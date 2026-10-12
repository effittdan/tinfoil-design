import { createServer } from "node:http";
import { readFile, stat, realpath } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import commerce from "../netlify/functions/commerce.mjs";
import reconcile from "../netlify/functions/reconcile.mjs";
import { database } from "./db.mjs";
import { limitQuotes } from "./rate-limit.mjs";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};
const safeHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};
async function bodyOf(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65536)
      throw Object.assign(Error("Request too large"), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function receiveForm(req, body, origin, ip) {
  if (req.headers.origin !== origin)
    return new Response("Invalid request origin.", { status: 403 });
  if (
    !req.headers["content-type"]?.startsWith(
      "application/x-www-form-urlencoded",
    )
  )
    return new Response("Invalid form.", { status: 415 });
  const data = new URLSearchParams(body.toString("utf8"));
  const form = data.get("form-name"),
    email = (data.get("email") || "").trim();
  if (data.get("bot-field")) return new Response(null, { status: 204 });
  if (
    !["contact", "frequency"].includes(form) ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    return new Response("Invalid form.", { status: 400 });
  const name = (data.get("name") || "").trim(),
    message = (data.get("message") || "").trim();
  if (
    form === "contact" &&
    (!name || name.length > 120 || !message || message.length > 5000)
  )
    return new Response("Invalid contact details.", { status: 400 });
  if (!process.env.DATABASE_URL && !process.env.NETLIFY_DB_URL)
    return new Response("Transmissions are not open yet.", { status: 503 });
  await limitQuotes("forms:" + ip);
  await database().query(
    "INSERT INTO tinfoil_submissions(id,form,email,name,message) VALUES($1,$2,$3,$4,$5)",
    [
      randomUUID(),
      form,
      email,
      form === "contact" ? name : null,
      form === "contact" ? message : null,
    ],
  );
  return new Response(null, { status: 204 });
}
export function storefrontServer({
  root = resolve("dist"),
  siteUrl = process.env.SITE_URL || "https://tinfoildesign.com",
} = {}) {
  const origin = new URL(siteUrl).origin;
  return createServer(async (req, res) => {
    const send = async (response) => {
      res.writeHead(response.status, {
        ...safeHeaders,
        ...Object.fromEntries(response.headers),
      });
      res.end(
        req.method === "HEAD"
          ? undefined
          : Buffer.from(await response.arrayBuffer()),
      );
    };
    try {
      const url = new URL(req.url, origin),
        ip = req.socket.remoteAddress || "shared";
      if (url.pathname === "/healthz")
        return await send(
          Response.json(
            { status: "ok" },
            { headers: { "Cache-Control": "no-store" } },
          ),
        );
      if (url.pathname.startsWith("/api/")) {
        const body = ["GET", "HEAD"].includes(req.method)
          ? undefined
          : await bodyOf(req);
        const request = new Request(url, {
          method: req.method,
          headers: req.headers,
          body,
        });
        return await send(await commerce(request, { ip }));
      }
      if (req.method === "POST" && url.pathname === "/")
        return await send(
          await receiveForm(req, await bodyOf(req), origin, ip),
        );
      if (!["GET", "HEAD"].includes(req.method))
        return await send(new Response("Method not allowed.", { status: 405 }));
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return await send(new Response("Invalid path.", { status: 400 }));
      }
      if (pathname.includes("\\") || pathname.includes("\0"))
        return await send(new Response("Not found.", { status: 404 }));
      let file = resolve(root, "." + pathname);
      if (!file.startsWith(root + sep) && file !== root)
        return await send(new Response("Not found.", { status: 404 }));
      try {
        if ((await stat(file)).isDirectory())
          file = resolve(file, "index.html");
        file = await realpath(file);
        if (!file.startsWith(root + sep)) throw Error("Invalid path");
        await stat(file);
      } catch {
        if (extname(pathname) || pathname.startsWith("/assets/"))
          return await send(new Response("Not found.", { status: 404 }));
        file = resolve(root, "index.html");
      }
      await send(
        new Response(await readFile(file), {
          headers: {
            "Content-Type": types[extname(file)] || "application/octet-stream",
            "Cache-Control": pathname.startsWith("/assets/")
              ? "public, max-age=604800"
              : "no-cache",
          },
        }),
      );
    } catch (e) {
      console.error("Storefront request failed:", e.name);
      await send(
        new Response("Service temporarily unavailable.", {
          status: e.status || 503,
        }),
      );
    }
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const server = storefrontServer();
  server.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
    console.log("Tinfoil storefront listening."),
  );
  const retry = setInterval(
    () => reconcile().catch(() => console.error("Reconciliation failed.")),
    600000,
  );
  retry.unref();
  const stop = () => {
    clearInterval(retry);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 20000).unref();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
