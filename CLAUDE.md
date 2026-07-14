# CLAUDE.md — verus-rpc-tester

Project conventions for humans and AI agents working in this repo. Keep changes small,
reviewable, and consistent with what's already here.

## What this is

A web UI for interactively calling every `verusd` JSON-RPC method against a running node.
An Express backend holds the RPC credentials and proxies to the daemon; a React + Vite SPA
is the client.

```
Browser  →  Express backend (holds RPC credentials, uses verus-rpc)  →  verusd
```

## Stack & layout

- **Backend:** Express + [`verus-rpc`](https://www.npmjs.com/package/verus-rpc), TypeScript, ESM.
- **Frontend:** React 18 + Vite, TypeScript.
- **Node:** 20.6+ (uses the built-in `--env-file`).

```
server/          Express backend — API routes, VerusClient, help parsing, danger denylist
web/             React + Vite SPA — src/App.tsx, src/api.ts, src/components/
assets/          README media (demo gif/mp4)
```

## Commands

| Command             | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | API (`:8787`) + Vite dev server (`:5173`) with watch |
| `npm run build`     | Build SPA + compile server to `dist/`                |
| `npm start`         | Serve built SPA + API from one process               |
| `npm run typecheck` | Type-check server and web (no emit)                  |

**Before opening a PR:** run `npm run typecheck` and `npm run build`. Both run in CI too.

## Code conventions

- TypeScript `strict` is on (plus `noUnusedLocals`/`noUnusedParameters`). Use the type
  system honestly — no `any` to silence errors, no unsafe `as` casts.
- Small, focused diffs. Don't mix refactors with feature work; don't touch unrelated files.
- Validate external input at the boundary. Errors returned to the client must be mapped
  through a client-safe shape — never leak internals or credentials (see `toClientError`).
- Match existing naming and structure. Comments explain *why*, not *what*.

## Security

- **Credentials never reach the browser.** They live only in `.env` (gitignored) and stay
  server-side — keep them out of responses, error messages, logs, and the copy-as-curl
  snippet. Never commit a real `.env`.
- State-changing RPC methods are confirm-gated in the UI via `server/dangerous.ts`. When
  adding a method that moves funds or changes wallet/chain/daemon state, add it there.

## Commits — Conventional Commits (required)

Every commit message follows [Conventional Commits](https://www.conventionalcommits.org/).
This is enforced on PRs by `.github/workflows/commitlint.yml` and it is what drives
releases.

```
<type>(<optional scope>): <description>
```

- **Types:** `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`.
- **Scopes** (suggested): `server`, `web`, `release`, `deps`.
- `feat:` → minor release. `fix:`/`perf:` → patch release. Other types → no release.
- Breaking changes: add `!` after the type/scope (`feat!:`) **or** a `BREAKING CHANGE:`
  footer → major release.

Examples: `feat(web): add copy-as-curl to result view`, `fix(server): reject non-array params`.

## Releases — automated, do not hand-roll

Releases are cut by [semantic-release](https://semantic-release.gitbook.io/) from
Conventional Commits, in `.github/workflows/release.yml` on every push to `main`.

- **Never hand-edit `CHANGELOG.md`** — it is generated.
- **Never manually bump the version** in `package.json` — semantic-release owns it. The
  committed version is the `0.0.0-development` sentinel.
- **Do not `git push`, tag, or publish a release without an explicit ask.** Merging a
  Conventional Commit to `main` is what triggers the release; let the pipeline do it.
