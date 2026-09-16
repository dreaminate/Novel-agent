# macOS 开发环境准备与唯一 DSH CLI — 2026-09-15

**性质：** 开发机环境搭建与实测记录。**没有改动任何产品源码、测试、规格文档或上游仓库。**
**授权：** 用户 2026-09-15 要求「做好开发前的准备工作，比如安装对应版本 dsh 等，我本地的 dsh 只保留一个，就是拿来开发这个项目的」。

## 0. 结论

| 项 | 结果 |
| --- | --- |
| DSH CLI | 本机唯一活动安装 `~/.local/lib/dsh/0.1.2-rc.1`：官方 `@deepseek-ai/dsh@0.1.2-rc.1` + 本仓库 Session 补丁；`dsh --version` = `0.1.2-rc.1` |
| 旧 CLI | `0.1.1-rc.2` 整份安装与 `dsh-coding` / `dsh-desktop` / `dsh-office` 三个包装命令退役到 `~/.local/lib/dsh-retired-20260915/`（**搬移，未删除**，可随时恢复） |
| 活动 `dsh` 命令 | `~/.local/bin/dsh`，唯一一个；指向上面那份 rc.1 安装 |
| 开发 Home | 仓库内 `.novel-agent/dsh-home`（gitignored），Profile `web` 装五个小说插件，Profile 内 `dsh-session` 已带补丁 |
| 用户全局 `~/.dsh` | **未改动**（`credentials.yaml`、`sessions/`、`storages/`、`profiles/` 原样保留） |
| 冒烟 | 真实 Host 启动、带 token 页面 HTTP 200、client loader HTTP 200（5,336,593 字节，含 `@novel-agent/novel-project/client.js`）、停止后端口释放 |

## 1. 本机工具链

| 项 | 值 |
| --- | --- |
| Node | `v24.14.1`（满足根 `package.json` 的 `^22.19.0 \|\| >=24.0.0`） |
| pnpm | `11.7.0`（corepack 解析自根 `packageManager`）；CLI 装插件时走 PATH 上的 `pnpm` |
| 仓库门禁 | `corepack pnpm install/build/typecheck/lint/test` 全绿，284 测试 |

## 2. 唯一 DSH CLI 的安装方式

新增 [`scripts/install-dsh.sh`](../scripts/install-dsh.sh)，与本仓库既有的
[`patches/README.md`](../patches/README.md) 约定一致：

1. 在 `$DSH_RUNTIME_DIR`（默认 `~/.local/lib/dsh/0.1.2-rc.1`）写入最小 pnpm workspace，
   `patchedDependencies` 指向本仓库补丁，安装 `@deepseek-ai/dsh@0.1.2-rc.1`；
2. 校验装出来的**每一份** `dsh-session` 都带补丁（进程级共享注册表标记
   `Symbol.for("@deepseek-ai/dsh-session/known-session-event-types")`）；
3. 生成 `$DSH_BIN_DIR/dsh`（默认 `~/.local/bin/dsh`）shim，PATH 里写入安装时解析到的
   `node` 与 `pnpm` 目录。

```bash
scripts/install-dsh.sh          # 幂等，可重复运行
dsh --version                   # 0.1.2-rc.1
```

为什么 CLI 自己也要打补丁：Profile 补丁只覆盖 Profile 内的 `dsh-session`，而真实 Host 的
`sessions` 服务与持久化 reader 可能解析出多份 `dsh-session`；只补一边时 required 的
`novel/automation-policy` 冷恢复会被拒绝（见 [automation 迁移记录](writing-automation-migration-2026-09-15.md)）。

## 3. 五个插件装入隔离 Profile

新增 [`scripts/install-plugins.sh`](../scripts/install-plugins.sh)，是既有 Windows
`scripts/install-plugins.ps1` 的等价实现（同样六步、同样校验）：

```bash
scripts/install-plugins.sh --dsh-home "$PWD/.novel-agent/dsh-home"
```

实测结果（`.novel-agent/dsh-home/profiles/web`）：

- `pnpm-workspace.yaml` 含 `patchedDependencies` 指向仓库补丁，并保留 `autoInstallPeers: false`；
- `node_modules/@novel-agent/{novel-project,novel-planning,novel-writing,novel-memory,novel-review}` 五个包齐全；
- Profile 内 `node_modules/@deepseek-ai/dsh-session/lib/index.js` 带
  `registerLogEventType` 与共享注册表标记；解析版本为 `0.1.2-rc.1`；
- Profile `package.json` 的 bundles 为 `dsh-base` + `dsh-web-app` + 五个小说插件。

## 4. 启动与冒烟证据

```bash
export DSH_HOME="$PWD/.novel-agent/dsh-home"
export DSH_TELEMETRY_DISABLED=1
dsh --profile web --host 127.0.0.1 --port 0 --no-open
```

| 检查 | 结果 |
| --- | --- |
| Host 启动日志 | 只有 `dsh web: http://127.0.0.1:<port>/?token=…` 一行，**0 条 error/failed/warn** |
| 带 token 访问根路径 | HTTP `303` → 设 cookie 后 HTTP `200`（24,553 字节） |
| 页面内插件清单 | 含 `@novel-agent/novel-project/client.js` |
| client loader `/plugins/??…client.js` | HTTP `200`，5,336,593 字节，`novel-project` 命中 156 次 |
| 停止 Host | 进程退出，监听端口释放（`lsof` 无残留） |

这只证明**加载与启动边界**：不等于 GUI 交互、真实模型回合或《雾港夜航》验收。

## 5. 旧 CLI 的退役方式（可恢复）

| 对象 | 处理 |
| --- | --- |
| `~/.local/lib/dsh/0.1.1-rc.2`（268 MB） | 整体移动到 `~/.local/lib/dsh-retired-20260915/0.1.1-rc.2` |
| `~/.local/bin/dsh-coding`、`dsh-desktop`、`dsh-office` | 移动到 `~/.local/lib/dsh-retired-20260915/bin/` |

恢复方式：把退役目录移回原位即可。确认不需要后可直接删除该退役目录（268 MB，官方包可重装）。
`~/.local/lib/dsh/` 现在只剩 `0.1.2-rc.1` 一个活动安装。

## 6. 已知问题与限制

- **`dsh plugin add` 可能在装完后长时间不返回。** 现象：插件与补丁已经落盘，但进程停在 pnpm 的
  供应链策略校验（网络请求重试；CPU 不推进、主线程停在 `uv__io_poll`），本次首次安装出现过一次
  5 分钟以上的停顿；随后同命令复跑只需 0.6 秒并打印
  `✓ Lockfile passes supply-chain policies (verified 9m ago)`。判定为 npm registry 侧慢/抖动，
  不是插件或 Profile 缺陷。遇到时不必反复重装，按第 3 节的标记校验即可确认状态。
- **本机未安装社区 Desktop 与三个社区插件。** `dsh-better-sidebar@0.16.1`、
  `@anweat/dsh-browser@0.1.9`、`dsh-web-search-pro@0.1.11` 在 `0.1.2-rc.1` 上加载失败
  （见 [兼容性记录](community-plugin-rc1-compatibility-2026-09-15.md)），所以开发 Profile 只装
  五个小说插件。Desktop `2.0.5` 仍未安装与验收。
- **未配置真实模型凭据。** `.novel-agent/dsh-home` 里没有 `.env`；真实 DeepSeek 回合需要用户
  自行在该隔离 Home 配置 `DEEPSEEK_API_KEY`（本记录不读取、不复制 `~/.dsh/.credentials.yaml`）。
- **`node-pty` 未编译**（`allowBuilds: node-pty: false`），与退役前的 `0.1.1-rc.2` 安装一致；
  需要 PTY 能力时把该项改成 `true` 重跑 `scripts/install-dsh.sh`。
- **`~/.dsh` 仍是 `dsh` 的默认 Home。** 不设 `DSH_HOME` 时 `dsh` 会使用该目录里既有的
  `coding` / `desktop` / `office` Profile（其插件仍是 rc.2 时代装的），因此本项目一律显式设置
  `DSH_HOME`。本次未按仓库规则改动用户全局 `.dsh`。
- 本记录只覆盖本机、本次组合；未做 GUI 交互、真实模型、Desktop 与跨机交叉验证。
