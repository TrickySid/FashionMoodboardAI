const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("./app");

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

test("health endpoint is public and reveals no configuration", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

test("expensive endpoints reject unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    for (const endpoint of ["/analyze-image", "/analyze-fashion"]) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert.equal(response.status, 401);
    }
  });
});

test("malformed JSON returns a controlled client error", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/analyze-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Malformed JSON request" });
  });
});

test("AI endpoints require JSON and disable response caching", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/analyze-image`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "image data",
    });

    assert.equal(response.status, 415);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });
});

test("CORS exposes API responses only to allowlisted browser origins", async () => {
  await withServer(async (baseUrl) => {
    const allowed = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "http://localhost:5173" },
    });
    const blocked = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "https://example.invalid" },
    });

    assert.equal(
      allowed.headers.get("access-control-allow-origin"),
      "http://localhost:5173"
    );
    assert.equal(blocked.headers.get("access-control-allow-origin"), null);
  });
});
