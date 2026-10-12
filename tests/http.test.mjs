import test from "node:test";
import assert from "node:assert/strict";
import { storefrontServer } from "../server/http.mjs";
test("standalone host serves routes and fails closed without credentials", async () => {
  const server = storefrontServer({ siteUrl: "http://127.0.0.1" });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const product = await fetch(base + "/product/black-file");
    assert.equal(product.status, 200);
    assert.match(await product.text(), /Black File Tee/);
    assert.equal((await fetch(base + "/assets/missing.js")).status, 404);
    assert.equal((await fetch(base + "/package.json")).status, 404);
    const config = await (await fetch(base + "/api/capabilities")).json();
    assert.equal(config.enabled, false);
    assert.equal(
      (
        await fetch(base + "/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            origin: "https://untrusted.example",
          },
          body: "form-name=frequency&email=test%40example.com",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(base + "/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            origin: "http://127.0.0.1",
          },
          body: "form-name=frequency&email=test%40example.com",
        })
      ).status,
      503,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
