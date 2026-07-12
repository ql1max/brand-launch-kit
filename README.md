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

## Development

```bash
npm install
npm run dev
```

Run `npm run lint` and `npm run build` before deployment.

## Deployment

The built static application is configured for Cloudflare Workers Static Assets:

```bash
npm run deploy
```
