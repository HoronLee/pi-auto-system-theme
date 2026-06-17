# pi-auto-system-theme

A [pi](https://pi.dev) extension that detects macOS light/dark appearance at pi startup and switches to one of two configurable pi themes.

## What it does

- Detects macOS system appearance once when pi starts.
- Applies `lightTheme` when macOS is in light mode.
- Applies `darkTheme` when macOS is in dark mode.
- Adds `/sync-theme` to force a manual sync.

## Install from GitHub

```bash
pi install git:github.com/HoronLee/pi-auto-system-theme
```

Or pin a release tag:

```bash
pi install git:github.com/HoronLee/pi-auto-system-theme@v0.1.0
```

Reload pi after installing:

```text
/reload
```

## Install from npm

After the package is published to npm:

```bash
pi install npm:pi-auto-system-theme
```

## Configure

Add `lightTheme` and `darkTheme` to `~/.pi/agent/settings.json`:

```json
{
  "lightTheme": "catppuccin-latte",
  "darkTheme": "catppuccin-mocha"
}
```

If you use Catppuccin, install its pi theme package too:

```bash
pi install git:github.com/otahontas/pi-coding-agent-catppuccin
```

Then reload or restart pi.

## Manual sync

Inside pi:

```text
/sync-theme
```

## Defaults

If `lightTheme` or `darkTheme` is missing, the extension falls back to pi's built-in `light` and `dark` themes.

## Platform support

This extension currently targets macOS because it uses:

```bash
osascript -e 'tell application "System Events" to tell appearance preferences to return dark mode'
```

On non-macOS systems or when detection fails, it falls back to the dark theme.

## Development

```bash
npm install --registry=https://registry.npmjs.org
npm run check
npm run pack:dry
```

Test locally without installing:

```bash
pi -e ./extensions/auto-system-theme.ts
```

Or install from a local checkout:

```bash
pi install /absolute/path/to/pi-auto-system-theme
```

## Release

This repository publishes to npm from GitHub Actions when a `v*` tag is pushed.

The workflow uses npm trusted publishing/provenance, matching npm's recommended GitHub Actions flow.
Configure this package's trusted publisher on npmjs.com after the package exists:

- Repository: `HoronLee/pi-auto-system-theme`
- Workflow: `publish.yml`
- Environment: leave empty unless you add one later

Then bump `package.json` version, commit, tag, and push:

```bash
git tag v0.1.0
git push origin main --tags
```

The GitHub Actions workflow will run typecheck, verify the npm package contents, and publish to npm with provenance.

## License

MIT
