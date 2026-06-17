# Repository Guidelines

## Project Structure & Module Organization

This repository contains a single pi extension package. The extension entrypoint is `extensions/auto-system-theme.ts`, and `package.json` exposes it through the `pi.extensions` field. Project metadata, scripts, and publish settings live in `package.json`. TypeScript compiler options are in `tsconfig.json`; Biome formatting and linting rules are in `biome.json`. There is no dedicated asset or test directory at the moment.

## Build, Test, and Development Commands

Use pnpm for dependency installation and checks:

```bash
pnpm install
pnpm check
pnpm pack:dry
```

`pnpm check` runs Biome first, then `tsc --noEmit`. `pnpm pack:dry` runs `npm pack --dry-run` so the dry-run packaging path matches the npm publish command used in CI. For local pi testing without installing the package, run:

```bash
pi -e ./extensions/auto-system-theme.ts
```

## Coding Style & Naming Conventions

Source code is TypeScript ESM targeting NodeNext. Keep compiler settings strict and avoid weakening `tsconfig.json` to work around type errors. Biome uses space indentation and the recommended lint preset; run `pnpm format` before final validation when files need formatting. Use descriptive camelCase names for functions and variables, PascalCase for exported or structural types, and uppercase snake case for constants such as `DEFAULT_DARK_THEME`.

## Testing Guidelines

There is currently no test framework configured. Treat `pnpm check` and `pnpm pack:dry` as required validation before publishing or opening a PR. For behavior changes, manually test the extension with `pi -e ./extensions/auto-system-theme.ts` and verify `/sync-theme` plus configured `lightTheme`, `darkTheme`, and `fallbackAppearance` values.

## Commit & Pull Request Guidelines

Recent history uses short imperative subjects with occasional Conventional Commit prefixes, for example `feat: support cross-platform theme sync` and `fix: publish from tag workflow`. Prefer the same style: concise subject, focused scope, and a body when the release or CI behavior needs explanation. PRs should describe the user-facing behavior, list validation commands run, and call out publish workflow or package metadata changes.

## Release Notes

Publishing is tag-driven through `.github/workflows/publish.yml`. The workflow installs with pnpm, validates with `pnpm check`, performs a dry pack, then publishes to npm with provenance. Keep `package.json` version, tag name, and README installation guidance aligned.
