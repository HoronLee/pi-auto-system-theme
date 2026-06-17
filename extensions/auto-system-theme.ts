import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const execAsync = promisify(exec);

const DEFAULT_LIGHT_THEME = "light";
const DEFAULT_DARK_THEME = "dark";

type AutoThemeSettings = {
  lightTheme?: string;
  darkTheme?: string;
};

type ThemeConfig = {
  lightTheme: string;
  darkTheme: string;
};

async function readThemeConfig(): Promise<ThemeConfig> {
  try {
    const raw = await readFile(join(homedir(), ".pi", "agent", "settings.json"), "utf8");
    const settings = JSON.parse(raw) as AutoThemeSettings;

    return {
      lightTheme: settings.lightTheme ?? DEFAULT_LIGHT_THEME,
      darkTheme: settings.darkTheme ?? DEFAULT_DARK_THEME,
    };
  } catch {
    return {
      lightTheme: DEFAULT_LIGHT_THEME,
      darkTheme: DEFAULT_DARK_THEME,
    };
  }
}

async function isMacDarkMode(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `osascript -e 'tell application "System Events" to tell appearance preferences to return dark mode'`,
    );
    return stdout.trim() === "true";
  } catch {
    // If detection fails, prefer dark for readability.
    return true;
  }
}

export default function (pi: ExtensionAPI) {
  let currentTheme: string | undefined;
  let lastError: string | undefined;

  async function syncTheme(ctx: ExtensionContext, notify = false) {
    if (!ctx.hasUI) return;

    const config = await readThemeConfig();
    const nextTheme = (await isMacDarkMode()) ? config.darkTheme : config.lightTheme;

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
      ctx.ui.notify(`Theme synced: ${nextTheme}`, "info");
    }
  }

  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setStatus("auto-theme", undefined);
    await syncTheme(ctx);
  });

  pi.registerCommand("sync-theme", {
    description: "Sync pi theme from macOS light/dark mode and settings.json lightTheme/darkTheme",
    handler: async (_args, ctx) => {
      await syncTheme(ctx, true);
    },
  });
}
