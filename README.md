# Brand Launch Kit

A local-first brand handoff tool that turns colors, logo variants, and usage decisions into a portable implementation kit: design tokens, brand guidelines, a website-generation prompt, and an AI coding skill.

## What it exports

- `brand.json` as the canonical structured specification
- Human-readable brand guidelines
- A prompt for generating an accessible one-page brand portal
- A reusable `SKILL.md` for AI-assisted implementation
- CSS variables and JSON color tokens
- Original uploaded logo assets

All processing happens in the browser. No files or brand data are uploaded.

[Live demo](https://brand-launch-kit.nostromohq.workers.dev)

## Architecture and toolchain

This is a local-first single-page Vite + React + TypeScript app; Cloudflare Workers Static Assets serves the built `dist` directory. Use Node `24.18.0` and pnpm `11.21.0` exclusively, with pnpm as the sole installer, script entry point, and owner of the single repository-owned `pnpm-lock.yaml`; Oxfmt `0.63.0` formats the project and Oxlint `1.77.0` lints it. Bun has no role here, so there are no Bun scripts, dependencies, or lockfiles. TanStack is intentionally not included; add it only if future scope needs routed, data, or server primitives—not merely for consistency.

## Getting started

```bash
pnpm install
pnpm run dev
```

## Checks and deployment

```bash
pnpm run check
pnpm run build
pnpm audit --audit-level=moderate
pnpm run deploy
```
