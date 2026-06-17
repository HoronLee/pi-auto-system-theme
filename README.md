# pi-auto-system-theme

一个 [pi](https://pi.dev) 扩展：在 pi 启动时检测系统浅色 / 深色外观，并切换到对应的可配置 pi 主题。

## 功能

- 在 pi 启动时检测一次系统外观。
- 系统为浅色模式时，应用 `lightTheme`。
- 系统为深色模式时，应用 `darkTheme`。
- 提供 `/sync-theme` 命令用于手动同步主题。
- 支持 macOS、Windows、Linux（Linux 为 best-effort 检测）。

## 安装

```bash
pi install npm:pi-auto-system-theme
```

安装后重新加载 pi：

```text
/reload
```

## 配置

在 `~/.pi/agent/settings.json` 中添加 `lightTheme` 和 `darkTheme`：

```json
{
  "lightTheme": "catppuccin-latte",
  "darkTheme": "catppuccin-mocha"
}
```

可选：检测失败时使用哪个外观作为回退。默认 `dark`：

```json
{
  "lightTheme": "catppuccin-latte",
  "darkTheme": "catppuccin-mocha",
  "fallbackAppearance": "dark"
}
```

`fallbackAppearance` 可选值：`"light"` 或 `"dark"`。

如果你使用 Catppuccin 主题，也需要安装对应的 pi 主题包：

```bash
pi install git:github.com/otahontas/pi-coding-agent-catppuccin
```

然后重新加载或重启 pi。

## 手动同步

在 pi 中执行：

```text
/sync-theme
```

## 默认值

如果没有配置：

- `lightTheme` 回退到 pi 内置 `light` 主题。
- `darkTheme` 回退到 pi 内置 `dark` 主题。
- `fallbackAppearance` 回退到 `dark`。

## 平台支持

| 平台 | 检测方式 |
| --- | --- |
| macOS | `osascript` 读取系统深色模式 |
| Windows | PowerShell 读取 `HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize\AppsUseLightTheme` |
| Linux | 依次尝试 `gsettings`、Freedesktop portal (`gdbus`)、KDE `kreadconfig6` / `kreadconfig5` |

Linux 桌面环境差异较大。若所有检测方式失败，扩展按 `fallbackAppearance` 选择主题。

当前扩展不会实时监听系统主题变化。它只在 pi 启动时同步一次，或在你执行 `/sync-theme` 时手动同步。

## 开发

```bash
pnpm install
pnpm check
pnpm pack:dry
```

本地测试（不安装）：

```bash
pi -e ./extensions/auto-system-theme.ts
```

或者从本地目录安装：

```bash
pi install /absolute/path/to/pi-auto-system-theme
```

## License

MIT
