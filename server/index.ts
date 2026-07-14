import path from "node:path";
import express from "express";
import { stringify as stringifyLossless } from "lossless-json";
import { TransportError, VerusRpcError } from "verus-rpc";
import { client, RPC_URL } from "./verus.js";
import { getMethods } from "./help.js";

const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT ?? 8787);

const app = express();
app.use(express.json({ limit: "1mb" }));

/** The daemon host (no credentials) — safe to show in the UI / copy-as-curl. */
function publicRpcHost(): string {
  try {
    return new URL(RPC_URL).host;
  } catch {
    return RPC_URL;
  }
}

/** Map any thrown error to a client-safe { code, message } — never leak internals/creds. */
function toClientError(err: unknown): { code: number | null; message: string } {
  if (err instanceof VerusRpcError) return { code: err.code, message: err.message };
  if (err instanceof TransportError) {
    return { code: null, message: `Transport error (${err.reason}): ${err.message}` };
  }
  if (err instanceof Error) return { code: null, message: err.message };
  return { code: null, message: "Unknown error" };
}

// Health/connection banner. Uses the curated getInfo mapper.
app.get("/api/status", async (_req, res) => {
  try {
    const info = await client.chain.getInfo();
    res.json({
      connected: true,
      host: publicRpcHost(),
      chain: info.name,
      blocks: info.blocks,
      version: info.VRSCversion ?? String(info.version),
    });
  } catch (err) {
    res.json({ connected: false, host: publicRpcHost(), error: toClientError(err).message });
  }
});

// Full method list, grouped by category, each tagged dangerous/not.
app.get("/api/methods", async (_req, res) => {
  try {
    const { categories } = await getMethods();
    res.json({ host: publicRpcHost(), categories });
  } catch (err) {
    res.status(502).json({ error: toClientError(err).message });
  }
});

// Per-method help text. :method is validated against the known set.
app.get("/api/help/:method", async (req, res) => {
  const method = req.params.method;
  try {
    const { names } = await getMethods();
    if (!names.has(method)) {
      res.status(404).json({ error: `Unknown method: ${method}` });
      return;
    }
    const text = await client.call("help", [method]);
    res.json({ method, text: typeof text === "string" ? text : String(text) });
  } catch (err) {
    res.status(502).json({ error: toClientError(err).message });
  }
});

// Execute any method. RPC-level errors return ok:false with HTTP 200 (they are
// expected results of testing, not server failures).
app.post("/api/call", async (req, res) => {
  const { method, params } = req.body ?? {};
  if (typeof method !== "string") {
    res.status(400).json({ ok: false, error: { code: null, message: "`method` must be a string" } });
    return;
  }
  if (params !== undefined && !Array.isArray(params)) {
    res.status(400).json({ ok: false, error: { code: null, message: "`params` must be an array" } });
    return;
  }
  try {
    const { names } = await getMethods();
    if (!names.has(method)) {
      res.status(400).json({ ok: false, error: { code: null, message: `Unknown method: ${method}` } });
      return;
    }
    const start = performance.now();
    const result = await client.call(method, params ?? [], { numbers: "lossless" });
    const ms = Math.round(performance.now() - start);
    // Lossless stringify preserves amount precision exactly for display.
    const resultText = stringifyLossless(result, null, 2) ?? "null";
    res.json({ ok: true, resultText, ms });
  } catch (err) {
    res.json({ ok: false, error: toClientError(err) });
  }
});

// Serve the built SPA in production. In dev, Vite serves the UI and proxies /api here.
const webDist = path.join(process.cwd(), "web", "dist");
app.use(express.static(webDist));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(webDist, "index.html"), (err) => {
    if (err) res.status(404).send("UI not built. Run `npm run build` first (or use `npm run dev`).");
  });
});

app.listen(PORT, HOST, () => {
  console.log(`verus-rpc-ui server on http://${HOST}:${PORT}  →  daemon ${publicRpcHost()}`);
});
