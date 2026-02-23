# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Balto ESLint is a GitHub Action (TypeScript, Node 20) that runs ESLint only on changed files in a pull request and annotates only changed lines. Built with `@vercel/ncc` to bundle into a single `dist/index.js`.

## Essential Commands

- `devbox setup` - Install dependencies
- `npm run build` - Bundle with ncc
- `npm test` - Build and run integration test via `act`
- `npm run dev` - Watch mode (rebuilds and re-runs test on changes)
- `devbox run rebuildtests` - Reset test fixtures and rebuild test snapshots

## Project Structure

```
src/
  index.ts            Action entrypoint
  eslint_result.ts    ESLint output parsing and annotation logic
  git_utils.ts        Git diff utilities (changed files/lines)
test/
  snapshots/          Canonical test fixture files
  v6/ v7/ v8/ v9/    Per-ESLint-version test workspaces
dist/                 Bundled output (committed, used by action runtime)
```

## Development Practices

- The bundled `dist/index.js` is committed and must be rebuilt before committing changes to `src/`
- Tests run via `act` (local GitHub Actions runner) against the test fixtures — not unit tests
- Prettier config lives in `package.json` (`"semi": false`) — run `npx prettier --write` on changed files
- TypeScript strict mode is enabled; avoid `as` casting
- Use `devbox` to manage the Node/Ruby/act toolchain rather than relying on system installs
