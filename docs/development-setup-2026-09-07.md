# 本机正式开发准备 — 2026-09-07

本记录覆盖开工环境、恢复基线、只读参考源码、现有插件构建/测试和隔离宿主 smoke。正式插件拆分尚未开始，后续按 `tasks/plan-final.md` 推进 M1 / Canon seam RED。

## 目录与工具链

| 用途 | 本机位置或版本 |
| --- | --- |
| 产品工作区 | `D:\Work\01_Projects\My-Projects\Original\novel-agent` |
| 开发支持目录 | `C:\coding-projects\novel-agent-development` |
| Node.js | `C:\Program Files\nodejs\node.exe`，`v24.20.0` |
| Corepack / 项目 pnpm | `0.35.0` / `11.7.0` |
| Git | `2.55.0.windows.5` |
| 独立 DSH CLI | `C:\coding-projects\novel-agent-development\runtime\node_modules\@deepseek-ai\dsh\lib\bin.js` |
| CLI 依赖清单与锁文件 | 支持目录的 `runtime/package.json`、`runtime/pnpm-workspace.yaml`、`runtime/pnpm-lock.yaml` |
| 项目打包产物 | 支持目录的 `artifacts/novel-agent-novel-project-0.0.0.tgz` |
| 社区 Desktop | 支持目录的 `desktop/app/DSH Desktop.exe`，`2.0.2` |

CLI 使用 `@deepseek-ai/dsh@0.1.1-rc.2`；独立工具环境将 DSH 包覆盖为精确 rc.2，并将 Cordis 固定为项目使用的 `4.0.1`。Web Profile 实际可解析的 188 个 DSH 包，其 manifest 版本全部为 `0.1.1-rc.2`。旧证据中的 `dsh-base` 内嵌 rc.1 版本字段异常在本次检查中没有复现。

CLI 安装先使用 `--ignore-scripts` 检查生命周期脚本，再执行已检查的 esbuild 和 DSH subprocess helper 构建步骤。未全局安装 npm 包，未修改 Machine 环境变量或代理配置。新 Desktop Profile 首次初始化时 Corepack 自动取得 pnpm 12.3.4；其后已将 Profile 明确固定为 `pnpm@11.7.0`，并用 11.7.0 完成 frozen install。

独立工具环境还直接安装了 `pnpm@11.7.0`。开发 PATH 使用 `runtime/node_modules/.bin`，让原生 `dsh plugin` 启动这个固定版本，避免新 Profile 再依赖 Corepack 的全局默认版本。最终直接执行该 pnpm shim 返回 `11.7.0`。

## 可恢复基线

迁移包原本没有 `.git`。本次先制作完整 ZIP，再初始化本地 Git；仓库仍没有 commit、remote 或已暂存文件，现存未跟踪文件不能视为本次新写的产品代码。

- 备份：`C:\coding-projects\novel-agent-development\backups\novel-agent-before-machine-prep-20260907-164857.zip`
- 大小：199,865,509 bytes；221 个文件逐一与备份前工作区核对一致。
- SHA-256：`a7383d2db3b4607f7a776c1dc44a3c23d26e1b79f5d3cda1bd3d0508db8bb784`
- 恢复时先将该 ZIP 解压到一个新目录并检查文件，再按需要恢复；它包含迁移时构建产物和上一轮已授权更新的 AGENTS.md。

原 `SHA256SUMS.txt` 保留为迁入时清单，不重写它来掩盖后续改动。准备结束前对照本次备份，10 个产品源码/测试文件全部保持原字节。

## 参考来源

以下均是官方 GitHub ZIP 源码归档，提交标识来自 ZIP comment；不是带历史的 Git checkout。Git HTTPS 握手多次失败后使用官方 codeload，未改变系统网络设置。源码只读，归档保存在支持目录的 `archives/`；原下载缓存也保留。全局记录见 `D:\Work\01_Projects\PROJECT_CATALOG.md`。

| 来源 | 固定版本 / 提交 | 支持目录下的参考路径 | 许可标识 |
| --- | --- | --- | --- |
| [DSH](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.1-rc.2) | `dsh-v0.1.1-rc.2` / `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` | `references/deepseek-harness-dsh-v0.1.1-rc.2` | MIT |
| [社区 Desktop](https://github.com/anywhere-labs/dsh-desktop/releases/tag/v2.0.2) | `v2.0.2` / `9d18856ddea4f20eb3ef8c88b0436921c6b19606` | `references/dsh-desktop-2.0.2` | MIT |
| [Codex](https://github.com/openai/codex/tree/rust-v0.152.0) | `rust-v0.152.0` / `316795b3cf2a45e90d121d9f46499d4658b2645c` | `references/codex-rust-v0.152.0` | Apache-2.0 |
| [Pi](https://github.com/earendil-works/pi/tree/v0.84.4) | `v0.84.4` / `b79e4cc834970cca69daebffab7df1da7d1e52c4` | `references/pi-0.84.4` | MIT |
| [Claude Code 公开仓库](https://github.com/anthropics/claude-code/tree/ab9b2cf7bb9e4f98ff264c07a22e46d83c29c558) | main 快照 / `ab9b2cf7bb9e4f98ff264c07a22e46d83c29c558` | `references/claude-code-main` | 上游 Commercial Terms；不等同于闭源运行时源码 |

源码归档 SHA-256：

| 归档 | SHA-256 |
| --- | --- |
| `dsh.zip` | `9a21c7a347ec59a7e7c91e7c805d8759d5b4357b2245d2e7d85a346c953c845f` |
| `desktop.zip` | `6e0630cda2d19ae69d9305cf8cfed4bcbe7a137191835d444f4ade09fa836789` |
| `pi.zip` | `e084c25be81d25dee44c70be83706e19f7dc0a79c3161acf1c5a345b37522540` |
| `codex.zip` | `71d7edeb12984ca4e7b38cc5643402364aa94f7761372ed970e1aec1cf77e39f` |
| `claude-code.zip` | `2b28e4855a3617a5f00c60d4077049a92085cc7a1d4b9de639c846a3e942c301` |

本次未更改 D 盘 A–K 开源目录和展示页。既有 MiroFish、OpenClaude、Codex/Claude/Pi 安装及其用户配置保持原样；参考项目没有构建或安装依赖。

五份源码共 16,845 个文件已与官方归档逐字节 SHA-256 核对，差异为零。

## 唯一的依赖声明修复

原 frozen install 成功，但首次测试仅 108 个通过，Remote 集成测试文件因无法导入 `@deepseek-ai/dsh-typert-registry` 而未加载；typecheck 同时报告 TS2307 和两个 `TypertRegistryContract.register` 类型错误。

测试第 39 行已经直接使用该官方包。确认 npm 的 rc.2 包存在、许可证为 MIT、没有 install lifecycle 后，在 `packages/novel-project/package.json` 补充精确的开发依赖，使用 `corepack pnpm install --ignore-scripts` 更新 lockfile。lockfile 只增加该 importer 的三行记录，没有更新依赖版本或删除测试。

## 本机验证

| 命令或检查 | 结果 |
| --- | --- |
| `corepack pnpm install --frozen-lockfile --ignore-scripts` | 原锁文件依赖恢复成功 |
| `corepack pnpm rebuild esbuild` | 两个已解析 esbuild 安装脚本成功 |
| `corepack pnpm build` | Typert、TypeScript、client bundle 构建成功 |
| `corepack pnpm test`（修复声明后） | 5 个文件，239/239 通过 |
| `corepack pnpm typecheck`（修复声明后） | 通过 |
| `corepack pnpm lint` | 通过 |
| 包目录 `corepack pnpm pack --pack-destination <artifacts>` | 生成 15 文件的插件包，包含 self-mount patch 和 Host/Remote/client 产物 |
| 独立 CLI `--version`、Web `--help` | `0.1.1-rc.2`；原生 host/port/no-open 参数可用 |
| stock `dsh plugin --profile <名称> add --ignore-scripts <本地插件路径>` | Web 的 `web` Profile 与 Desktop 实际启用的 `desktop` Profile 均安装成功 |

插件 tgz SHA-256：`178797939a22448af2c0ad08ba6f56ce53380c473b5ff171cfbc41af156f3dec`。

### Web smoke

使用 `DSH_HOME=C:\coding-projects\novel-agent-development\profiles-smoke-20260907`，监听 `127.0.0.1:57188`。通过 DSH 原生 `workspace.create` / `session.create` 创建 `smoke-workspace` 和空 Session，原生只读 `/goal` 命令返回未设置目标，不创建目标或调用模型。

浏览器实际进入 `conversation.view` 的 Novel Project，显示 Revision 0、空 Canon、空正文和全部十个时钟桶；刷新并选择稍后配置密钥后仍恢复该面板。浏览器控制台 error/warn 列表为空。原生目录选择器已能打开，但自动化输入未可靠完成，因此工作区采用 DSH 现有 Host API 注册，不把这次操作计作完整目录选择 UI 验收。

### Desktop smoke

安装包保存为支持目录的 `desktop/DSH-Desktop-2.0.2-x64-Setup.exe`，132,417,238 bytes，SHA-256 与官方 Release 一致：`b31f63f8cf70d3fc07ed2ae36e5de7b1939e604bdb3be097de3383a82a06a787`。NSIS 以 `/S /D=<desktop/app>` 完成安装，退出码 0。

使用独立 `desktop-smoke-home-20260907` 和 `desktop-userdata-20260907`。Desktop 默认选择自己创建的 `desktop` Profile；仅安装到同一 Home 的 `web` Profile 不会使默认桌面加载小说插件。因此本次又通过原生命令安装到实际启用的 `desktop` Profile，在固定 pnpm 11.7.0 后重新启动。最终健康快照明确包含 `dsh-base`、`dsh-web-app` 与 `@novel-agent/novel-project`，`startup.run.completed` 为 healthy，耗时 2,827.547ms。原生 AX 能读取 Desktop 的内测声明。

清理范围仅限本次测试进程。Web 用 Ctrl+C 停止，PowerShell 包装进程返回 1；Desktop 的后台测试进程树按明确 PID 回收。这不证明 Windows 托盘 Quit 的优雅退出或完整生命周期验收。正式产品验收仍需单独验证这些行为，不据此声称 Desktop parity 完成。

最终检查 Web 的 57188 与 Desktop 的 43120 端口均无监听器。

## 开发命令

项目检查：

```powershell
Set-Location 'D:\Work\01_Projects\My-Projects\Original\novel-agent'
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
```

启动已准备的隔离 Web Profile：

```powershell
$env:DSH_HOME = 'C:\coding-projects\novel-agent-development\profiles-smoke-20260907'
$env:DSH_TELEMETRY_DISABLED = '1'
$env:PATH = 'C:\coding-projects\novel-agent-development\runtime\node_modules\.bin;' + $env:PATH
node 'C:\coding-projects\novel-agent-development\runtime\node_modules\@deepseek-ai\dsh\lib\bin.js' --profile web --host 127.0.0.1 --port 0 --no-open
```

需要桌面交互时，在同一 PowerShell 中选择桌面隔离 Home，再显式启动现成 EXE：

```powershell
$env:DSH_HOME = 'C:\coding-projects\novel-agent-development\desktop-smoke-home-20260907'
& 'C:\coding-projects\novel-agent-development\desktop\app\DSH Desktop.exe' '--user-data-dir=C:\coding-projects\novel-agent-development\desktop-userdata-20260907'
```

下一次兼容性验收应换一个全新的 `DSH_HOME`，通过原生 `dsh plugin --profile web add` 安装当前构建。不要以本文的 smoke Profile 代替 fresh-install 证据。

## 正式开发入口与证据限制

先做 Canon 扩展的 focused RED，再按最终计划推进 Planning / Writing / Review 的首条真实闭环；这次没有拆包或修改产品源码。

DSH 接口参考入口包括 `packages/boot/app-boot/src/profile.ts`、`apps/cli/src/plugin.ts`、`packages/host/apiproxy/src/api/`、`packages/typert/registry/` 和现有 Remote 集成测试。`TypertRegistry.register` 是远端 descriptor 注册；项目自己设计的 `NovelCanon.registerExtension` 是另一个问题。旧报告中找不到该方法名的搜索结果，不能单独证明 Cordis 无法支持小说扩展注册；M1 必须验证可观察行为。

尚未配置模型密钥，未调用付费/外部模型，未恢复原机被排除的 DSH Profile、小说正文与运行数据。MiroFish sidecar、可选社区插件完整交互、真实多章写作、CI、生产和用户验收均不在这次开工环境的通过声明中。用户全局 `.dsh` 在本次检查前后均不存在。未提交、推送、发布或部署。
