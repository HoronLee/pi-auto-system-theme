# pi-auto-system-theme

一个 [pi](https://pi.dev) 扩展：在 pi 启动时检测 macOS 的浅色 / 深色外观，并切换到对应的可配置 pi 主题。

## 功能

- 在 pi 启动时检测一次 macOS 系统外观。
- macOS 为浅色模式时，应用 `lightTheme`。
- macOS 为深色模式时，应用 `darkTheme`。
- 提供 `/sync-theme` 命令用于手动同步主题。

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

如果没有配置 `lightTheme` 或 `darkTheme`，扩展会回退到 pi 内置的 `light` 和 `dark` 主题。

## 平台支持

该扩展目前面向 macOS，因为它通过下面的命令检测系统外观：

```bash
osascript -e 'tell application "System Events" to tell appearance preferences to return dark mode'
```

在非 macOS 系统上，或检测失败时，会回退到深色主题。

## 开发

```bash
npm install --registry=https://registry.npmjs.org
npm run check
npm run pack:dry
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
