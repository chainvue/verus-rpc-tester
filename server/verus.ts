import { VerusClient } from "verus-rpc";

/**
 * Single VerusClient built from environment. Credentials never leave the server.
 * Throws early (at startup) if required env is missing.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

export const RPC_URL = requireEnv("VERUS_RPC_URL");

export const client = new VerusClient({
  url: RPC_URL,
  user: requireEnv("VERUS_RPC_USER"),
  pass: requireEnv("VERUS_RPC_PASS"),
  timeoutMs: 60_000,
});
