import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);

export default async function globalSetup() {
  const viteEntry = require.resolve("vite", { paths: [resolve("frontend")] });
  const { createServer } = await import(pathToFileURL(viteEntry).href);
  const { startMockBackend, closeMockBackend } = require("./mock-backend.cjs");

  const vite = await createServer({
    root: resolve("frontend"),
    mode: "test",
    logLevel: "warn",
    server: {
      host: "127.0.0.1",
      port: 4173,
      strictPort: true,
    },
  });
  await vite.listen();

  let backend;
  try {
    backend = await startMockBackend();
  } catch (error) {
    await vite.close();
    throw error;
  }

  return async () => {
    await closeMockBackend(backend);
    await vite.close();
  };
}
