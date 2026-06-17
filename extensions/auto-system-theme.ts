import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";

const execFileAsync = promisify(execFile);

const DEFAULT_LIGHT_THEME = "light";
const DEFAULT_DARK_THEME = "dark";
const DEFAULT_FALLBACK_APPEARANCE: Appearance = "dark";
const DETECTION_TIMEOUT_MS = 2_000;

type Appearance = "light" | "dark";
type DetectedAppearance = Appearance | "unknown";

type AutoThemeSettings = {
  lightTheme?: string;
  darkTheme?: string;
  fallbackAppearance?: Appearance;
};

type ThemeConfig = {
  lightTheme: string;
  darkTheme: string;
  fallbackAppearance: Appearance;
};

async function readThemeConfig(): Promise<ThemeConfig> {
  try {
    const raw = await readFile(
      join(homedir(), ".pi", "agent", "settings.json"),
      "utf8",
    );
    const settings = JSON.parse(raw) as AutoThemeSettings;
    const fallbackAppearance =
      settings.fallbackAppearance === "light" ||
      settings.fallbackAppearance === "dark"
        ? settings.fallbackAppearance
        : DEFAULT_FALLBACK_APPEARANCE;

    return {
      lightTheme: settings.lightTheme ?? DEFAULT_LIGHT_THEME,
      darkTheme: settings.darkTheme ?? DEFAULT_DARK_THEME,
      fallbackAppearance,
    };
  } catch {
    return {
      lightTheme: DEFAULT_LIGHT_THEME,
      darkTheme: DEFAULT_DARK_THEME,
      fallbackAppearance: DEFAULT_FALLBACK_APPEARANCE,
    };
  }
}

async function runCommand(
  command: string,
  args: string[],
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(command, args, {
      timeout: DETECTION_TIMEOUT_MS,
      windowsHide: true,
    });
    return stdout.trim();
  } catch {
    return undefined;
  }
}

async function detectMacAppearance(): Promise<DetectedAppearance> {
  const stdout = await runCommand("osascript", [
    "-e",
    'tell application "System Events" to tell appearance preferences to return dark mode',
  ]);

  if (stdout === "true") return "dark";
  if (stdout === "false") return "light";
  return "unknown";
}

async function detectWindowsAppearance(): Promise<DetectedAppearance> {
  const stdout = await runCommand("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    "(Get-ItemProperty -Path HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize -Name AppsUseLightTheme).AppsUseLightTheme",
  ]);

  if (stdout === "0") return "dark";
  if (stdout === "1") return "light";
  return "unknown";
}

function parseLinuxColorScheme(stdout: string | undefined): DetectedAppearance {
  const value = stdout?.toLowerCase() ?? "";
  if (value.includes("prefer-dark") || value.includes("dark")) return "dark";
  if (value.includes("prefer-light") || value.includes("light")) return "light";
  return "unknown";
}

function parsePortalColorScheme(
  stdout: string | undefined,
): DetectedAppearance {
  const value = stdout ?? "";
  const match = value.match(/uint32\s+([0-2])/);
  if (match?.[1] === "1") return "dark";
  if (match?.[1] === "2") return "light";
  return "unknown";
}

async function detectLinuxAppearance(): Promise<DetectedAppearance> {
  const gsettingsAppearance = parseLinuxColorScheme(
    await runCommand("gsettings", [
      "get",
      "org.gnome.desktop.interface",
      "color-scheme",
    ]),
  );
  if (gsettingsAppearance !== "unknown") return gsettingsAppearance;

  const portalAppearance = parsePortalColorScheme(
    await runCommand("gdbus", [
      "call",
      "--session",
      "--dest",
      "org.freedesktop.portal.Desktop",
      "--object-path",
      "/org/freedesktop/portal/desktop",
      "--method",
      "org.freedesktop.portal.Settings.Read",
      "org.freedesktop.appearance",
      "color-scheme",
    ]),
  );
  if (portalAppearance !== "unknown") return portalAppearance;

  for (const command of ["kreadconfig6", "kreadconfig5"]) {
    const kdeAppearance = parseLinuxColorScheme(
      await runCommand(command, ["--group", "General", "--key", "ColorScheme"]),
    );
    if (kdeAppearance !== "unknown") return kdeAppearance;
  }

  return "unknown";
}

async function detectSystemAppearance(): Promise<DetectedAppearance> {
  switch (platform()) {
    case "darwin":
      return detectMacAppearance();
    case "win32":
      return detectWindowsAppearance();
    case "linux":
      return detectLinuxAppearance();
    default:
      return "unknown";
  }
}

function selectTheme(
  config: ThemeConfig,
  appearance: DetectedAppearance,
): string {
  const resolvedAppearance =
    appearance === "unknown" ? config.fallbackAppearance : appearance;
  return resolvedAppearance === "dark" ? config.darkTheme : config.lightTheme;
}

export default function (pi: ExtensionAPI) {
  let currentTheme: string | undefined;
  let lastError: string | undefined;

  async function syncTheme(ctx: ExtensionContext, notify = false) {
    if (!ctx.hasUI) return;

    const config = await readThemeConfig();
    const appearance = await detectSystemAppearance();
    const nextTheme = selectTheme(config, appearance);

    if (nextTheme === currentTheme && !notify) return;

    const result = ctx.ui.setTheme(nextTheme);
    if (!result.success) {
      const message = `Auto theme failed for "${nextTheme}": ${result.error ?? "unknown error"}`;
      if (message !== lastError || notify) {
        ctx.ui.notify(message, "error");
      }
      lastError = message;
      return;
    }

    currentTheme = nextTheme;
    lastError = undefined;

    if (notify) {
      const suffix = appearance === "unknown" ? " (fallback)" : "";
      ctx.ui.notify(`Theme synced: ${nextTheme}${suffix}`, "info");
    }
  }

  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setStatus("auto-theme", undefined);
    await syncTheme(ctx);
  });

  pi.registerCommand("sync-theme", {
    description:
      "Sync pi theme from system light/dark mode and settings.json lightTheme/darkTheme",
    handler: async (_args, ctx) => {
      await syncTheme(ctx, true);
    },
  });
}
