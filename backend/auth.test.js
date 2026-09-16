const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createVerifyToken,
  extractBearerToken,
  getFirebaseProjectId,
} = require("./auth");

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("extractBearerToken accepts exactly one bearer token", () => {
  assert.equal(extractBearerToken("Bearer valid-token"), "valid-token");
  assert.equal(extractBearerToken("bearer valid-token"), null);
  assert.equal(extractBearerToken("Bearer token extra"), null);
  assert.equal(extractBearerToken(undefined), null);
});

test("getFirebaseProjectId requires an explicit Firebase Auth project", () => {
  assert.equal(
    getFirebaseProjectId({ FIREBASE_PROJECT_ID: " fashion-moodboard-ai-a955c " }),
    "fashion-moodboard-ai-a955c"
  );
  assert.throws(() => getFirebaseProjectId({}), /FIREBASE_PROJECT_ID is required/);
});

test("verifyToken rejects a missing token", async () => {
  const middleware = createVerifyToken(async () => ({ uid: "unused" }));
  const req = { headers: {} };
  const res = createResponse();
  let calledNext = false;

  await middleware(req, res, () => {
    calledNext = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(calledNext, false);
});

test("verifyToken attaches only verified identity", async () => {
  let argumentCount = 0;
  const middleware = createVerifyToken(async function verify(token) {
    assert.equal(token, "valid-token");
    argumentCount = arguments.length;
    return { uid: "verified-user" };
  });
  const req = { headers: { authorization: "Bearer valid-token" } };
  const res = createResponse();
  let calledNext = false;

  await middleware(req, res, () => {
    calledNext = true;
  });

  assert.equal(req.user.uid, "verified-user");
  assert.equal(argumentCount, 1);
  assert.equal(calledNext, true);
});

test("verifyToken rejects invalid or expired tokens", async () => {
  const middleware = createVerifyToken(async () => {
    const error = new Error("expired");
    error.code = "auth/id-token-expired";
    throw error;
  });
  const req = { headers: { authorization: "Bearer expired-token" } };
  const res = createResponse();

  await middleware(req, res, () => assert.fail("next must not be called"));

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Authentication required" });
});
