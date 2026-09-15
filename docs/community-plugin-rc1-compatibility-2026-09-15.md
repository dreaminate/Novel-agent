# 社区插件在 DSH rc.1 的加载兼容性 — 2026-09-15

**性质：** 真实隔离 Profile 的安装/加载证据；用于修正兼容性声明，不涉及产品代码。

## 环境

- DSH_HOME：`.novel-agent/acceptance/real-model-20260915/dsh-home`（官方 `0.1.2-rc.1` Host + 本项目 Session 补丁，Profile `web`）
- 安装命令与 README 记录一致：`dsh plugin --profile web add --allow-build=... <pkg>@<version>`
- 安装本身成功（pnpm 解析、下载、构建均完成，node-pty/sharp/tesseract.js 构建放行）。

## 结果：三个插件加载失败（rc.1 不兼容）

Host 启动时 `plugin tree failed to load`，逐项错误：

| 插件 | 版本 | 失败原因 |
| --- | --- | --- |
| `dsh-better-sidebar` | 0.16.1 | `@deepseek-ai/dsh-settings` 不提供导出 `settingsNamespace` |
| `@anweat/dsh-browser` | 0.1.9 | 同上（`settingsNamespace`） |
| `dsh-web-search-pro` | 0.1.11 | 同上（`installSettingsSection`） |

它们加载的 `@deepseek-ai/dsh-settings`（rc.1）没有这些导出，说明这些版本面向更新的 DSH（rc.2 时代）。README 的社区插件表据此需要修正或标注「未在 rc.1 验证/不兼容」。

## 处置

- 已从该隔离 Profile 移除上述三个插件（`dsh plugin --profile web remove ...`），保留五个小说插件与 `dsh-file-upload@0.4.3`。
- 移除后 Host 正常启动：根页面 HTTP 200，client loader artifact `/plugins/??@deepseek-ai/dsh-client-modules/client.js` HTTP 200（证据 `real-model-20260915/evidence/boot-smoke.json`），Host 停止且端口释放。
- `dsh-file-upload@0.4.3` 未出现同一 settings 导出错误，启动日志中其自检信息正常输出。

## 限制与未验证

- 未逐一测试三个插件的更老版本；是否存在面向 rc.1 的版本未排查。
- 未做浏览器 UI 交互，只验证 Host 加载与页面/加载器 artifact。
- 该结论只覆盖本机、本 Profile、上述精确版本。
