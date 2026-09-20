const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("./app");
const { createAnalyzeImage } = require("./middleware");

async function withServer(run, routeDependencies) {
  const server = createApp(routeDependencies).listen(0);
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

function mockVerifyToken(req, res, next) {
  if (req.headers.authorization !== "Bearer test-token") {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.user = { uid: "verified-user" };
  return next();
}

function fashionPayload(count = 3) {
  return {
    uid: "client-supplied-user",
    images: Array.from({ length: count }, (_, index) => ({
      image: `Image ${index + 1}`,
      labels: [{ description: "Black/white blazer", confidence: 92.5 }],
    })),
  };
}

function authenticatedRequest(body) {
  return {
    method: "POST",
    headers: {
      Authorization: "Bearer test-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
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

test("malformed bearer tokens are rejected before provider work", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/analyze-image`, {
      method: "POST",
      headers: {
        Authorization: "not-a-bearer-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 401);
  });
});

test("authenticated identity comes from verified token middleware", async () => {
  await withServer(
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/analyze-image`,
        authenticatedRequest({ uid: "forged-user" })
      );

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        verifiedUid: "verified-user",
        suppliedUid: "forged-user",
      });
    },
    {
      verifyTokenMiddleware: mockVerifyToken,
      analyzeImageHandler(req, res) {
        res.json({
          verifiedUid: req.user.uid,
          suppliedUid: req.body.uid,
        });
      },
    }
  );
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

test("oversized JSON returns a controlled 413 response", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/analyze-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: "A".repeat(7 * 1024 * 1024) }),
    });

    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: "Request body is too large" });
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
    const production = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "https://fashion-moodboard-ai-a955c.web.app" },
    });

    assert.equal(
      allowed.headers.get("access-control-allow-origin"),
      "http://localhost:5173"
    );
    assert.equal(
      production.headers.get("access-control-allow-origin"),
      "https://fashion-moodboard-ai-a955c.web.app"
    );
    assert.equal(blocked.headers.get("access-control-allow-origin"), null);
  });
});

test("authenticated image requests validate signatures and use mocked Vision", async () => {
  let calls = 0;
  const analyzeImageHandler = createAnalyzeImage(() => ({
    async annotateImage() {
      calls += 1;
      return [{
        labelAnnotations: [{ description: "Blazer", score: 0.925 }],
        imagePropertiesAnnotation: { dominantColors: { colors: [] } },
      }];
    },
  }));

  await withServer(
    async (baseUrl) => {
      const signatures = [
        Buffer.from([0xff, 0xd8, 0xff, 0xdb]),
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.from("RIFF0000WEBP", "ascii"),
      ];

      for (const signature of signatures) {
        const response = await fetch(
          `${baseUrl}/analyze-image`,
          authenticatedRequest({ imageBase64: signature.toString("base64") })
        );
        assert.equal(response.status, 200);
        assert.deepEqual((await response.json()).labels, [
          { description: "Blazer", confidence: 92.5 },
        ]);
      }

      for (const body of [
        {},
        { imageBase64: "not base64" },
        { imageBase64: Buffer.from("fake image").toString("base64") },
        { imageBase64: "" },
      ]) {
        const response = await fetch(
          `${baseUrl}/analyze-image`,
          authenticatedRequest(body)
        );
        assert.equal(response.status, 400);
      }

      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff);
      const oversizedResponse = await fetch(
        `${baseUrl}/analyze-image`,
        authenticatedRequest({ imageBase64: oversized.toString("base64") })
      );
      assert.equal(oversizedResponse.status, 400);
      assert.equal(calls, 3);
    },
    { verifyTokenMiddleware: mockVerifyToken, analyzeImageHandler }
  );
});

test("fashion endpoint validates requests and returns structured mocked recommendations", async () => {
  const generateRecommendations = async (_prompt, imageCount) => ({
    provider: "test",
    model: "deterministic",
    recommendations: Array.from({ length: imageCount }, (_, index) => ({
      imageNumber: index + 1,
      recommendations: ["Tip one", "Tip two", "Tip three"],
    })),
  });

  await withServer(
    async (baseUrl) => {
      const valid = await fetch(
        `${baseUrl}/analyze-fashion`,
        authenticatedRequest({
          ...fashionPayload(),
          styleProfile: {
            summary: "Tailored styling—black/white + silver.",
            sourceLooks: 3,
            preferredColors: [{ name: "Black" }],
            recurringPieces: [{ name: "Blazer" }],
            stylingThemes: [{ name: "Tailored" }],
          },
        })
      );
      assert.equal(valid.status, 200);
      assert.equal((await valid.json()).recommendations.length, 3);

      for (const body of [
        fashionPayload(2),
        fashionPayload(7),
        { images: [{ labels: [] }, { labels: [] }, { labels: [] }] },
        {
          ...fashionPayload(),
          images: fashionPayload().images.map((image) => ({
            ...image,
            labels: [{ description: "Blazer", confidence: 101 }],
          })),
        },
      ]) {
        const response = await fetch(
          `${baseUrl}/analyze-fashion`,
          authenticatedRequest(body)
        );
        assert.equal(response.status, 400);
      }
    },
    { verifyTokenMiddleware: mockVerifyToken, generateRecommendations }
  );
});

test("provider failures return one controlled response without internal details", async () => {
  for (const providerError of [
    Object.assign(new Error("provider secret detail"), { code: "ETIMEDOUT" }),
    Object.assign(new Error("provider rejected key"), { response: { status: 401 } }),
    new Error("missing or malformed response"),
  ]) {
    const logEntries = [];
    const originalConsoleError = console.error;
    console.error = (...args) => logEntries.push(args);

    await withServer(
      async (baseUrl) => {
        const response = await fetch(
          `${baseUrl}/analyze-fashion`,
          authenticatedRequest(fashionPayload())
        );
        const body = await response.json();
        assert.equal(response.status, 502);
        assert.deepEqual(body, {
          error: "The stylist service is temporarily unavailable. Please try again.",
        });
        assert.equal(JSON.stringify(body).includes(providerError.message), false);
      },
      {
        verifyTokenMiddleware: mockVerifyToken,
        generateRecommendations: async () => {
          throw providerError;
        },
      }
    );

    console.error = originalConsoleError;
    assert.equal(JSON.stringify(logEntries).includes(providerError.message), false);
  }
});

test("authenticated per-user Vision rate limit is active", async () => {
  await withServer(
    async (baseUrl) => {
      let lastResponse;
      for (let request = 0; request < 37; request += 1) {
        lastResponse = await fetch(
          `${baseUrl}/analyze-image`,
          authenticatedRequest({ imageBase64: "ignored-by-test-handler" })
        );
      }

      assert.equal(lastResponse.status, 429);
      assert.deepEqual(await lastResponse.json(), {
        error: "Image analysis limit reached. Please try again later.",
      });
    },
    {
      verifyTokenMiddleware: mockVerifyToken,
      analyzeImageHandler(_req, res) {
        res.status(200).json({ labels: [] });
      },
    }
  );
});
