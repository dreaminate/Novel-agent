# 官方 DSH 完整宿主升级试跑 — 2026-09-08

**结果：npm 默认最新版 `0.1.2-rc.1` 已完成全新隔离安装、Web Host 启动、真实 Remote、完整进程重启和同 ID 恢复试验。普通会话恢复成功；带 `novel/canon/accepted` 的会话仍被上游拒绝恢复。最新 alpha `0.1.3-alpha.2` 已完成依赖下载和链接，但原生依赖未构建成功，Host 未启动，不能声称完成其冷恢复测试。**

这是用户允许评估、采用通过验证的官方版本后追加的完整宿主试跑。此前的[发布包评估](open-source-evaluations/dsh-session-event-upgrade-2026-09-08.md)只证明 Session writer/reader 行为，不能代替本报告的宿主证据。

## 版本与隔离环境

2026-09-08 核对官方 npm 元数据和 [DSH Releases](https://github.com/deepseek-ai/deepseek-harness/releases)：

| 范围 | 精确版本 | 本轮证据 |
| --- | --- | --- |
| npm `latest` / `next` | `0.1.2-rc.1`，2026-09-03 发布 | 独立完整 CLI 依赖树，499 个物理 manifest，全部 DSH 包仅解析为此版本 |
| npm `alpha` | `0.1.3-alpha.2`，2026-09-07 发布 | 独立完整 CLI 依赖树，513 个物理 manifest，全部 DSH 包仅解析为此版本；原生构建尚未成功 |

所有试验位于仓库的 `.novel-agent/upstream-evaluation/2026-09-08/`：

- `full-runtime-latest/`、`full-runtime-alpha/`：分别精确依赖对应版本的完整 `@deepseek-ai/dsh`，各有独立 manifest、lockfile、node_modules 和 `installed-inventory.json`。
- `full-host-latest/`、`full-host-alpha/`：分别拥有全新的 `dsh-home/` 和空的 `workspace/`。
- `full-host-fixture/` 与 `full-host-artifacts/`：最小事件诊断插件、安装包、只使用官方 HTTP Remote 的试验客户端和过滤后的结果。用于复核协议问题，不是交付的小说插件。

安装先禁用依赖脚本并记录 manifest 的许可证和脚本；alpha 之后只放行 `fs-ext` 的正常构建。没有把全部依赖视为 MIT，也未完成供产品采用所需的全部传递许可证审查。未修改根产品依赖、根 lockfile、参考 checkout、用户全局 `.dsh` 或上游代码。

## 最小事件插件与调用方式

安装到官方 `web` Profile 的诊断插件仅注入原生 `agents` 服务，监听 `agent/session-start`。当来源为 `startup` 且 ID 为 `fixture-canon-session` 时，调用一次正常的 `agent.session.append('novel/canon/accepted', payload)`。payload 仅有四个合成字段：projectId、revision、deltaRefs、sourceSessionId。插件没有 Agent Loop、存储写入、事件信封补丁或模型调用；恢复时不会重新发出该事件。

实际安装入口是各独立 runtime 的 `node_modules/@deepseek-ai/dsh/lib/bin.js`：

```text
node <完整 CLI> plugin --profile web add --ignore-scripts <诊断插件 tgz>
node <完整 CLI> --profile web --host 127.0.0.1 --port 0 --no-open
```

每次进程均指定对应的隔离 `DSH_HOME`，关闭遥测，cwd 为该次空 workspace。HTTP 客户端先经过宿主正常的 token-to-cookie 握手，再调用 `session/create` 和 `session/rename`。凭据不进入结果文件；试验结束后内存引用已清空。

首次试启动的工具输出曾直接回显临时登录 URL，随后立即停止该 Host，令该次凭据失效；此后启动输出先过滤，认证材料只在内存和原生认证通道中传递。报告与结果文件不保留该值。

## `0.1.2-rc.1` 的完整重启结果

两个测试 Session 使用同一 Host、同一空 workspace 和同一官方持久化实现。测试中没有发送 prompt 或启动模型轮次。

| 阶段 | 内置事件对照 `fixture-control-session` | 自定义事件 `fixture-canon-session` |
| --- | --- | --- |
| 首次启动端口 59238 | create 成功；rename 成功，seq 3 | create 成功，插件正常 append；rename 成功，seq 4 |
| 停止整个 Host | JSONL.zstd 已落盘 | JSONL.zstd 已落盘 |
| 新进程、同 Home，端口 52611 | 同 ID create 成功；rename 成功，seq 5 | 同 ID create 被拒绝：`gateway/internal`，内层 `SessionQueryError` |

两次 Host 的认证后首页均 HTTP 200，标题为 DeepSeek Harness。RPC 的 HTTP 200 只代表传输成功；自定义会话恢复的实际结果是 `result.ok: false`，未被误记为成功。

原始业务拒绝的关键内容：

```text
session "fixture-canon-session" contains event type "novel/canon/accepted"
(seq 3) unknown to this harness and not marked ignorable;
refusing to interpret the log
```

| 文件 | 停机后、恢复前 | 恢复试验后 |
| --- | --- | --- |
| 自定义会话日志 | 571 bytes；SHA-256 `ef2dafcf504e7e20d0ec0715db54d81e0a71317506027668ba6e0c8cf5877a9e` | 大小和 SHA-256 完全不变 |
| 普通会话日志 | 487 bytes；SHA-256 `11d0dfefdc95e75bc06973e96bc58da5775e8da80d41b81c3b22888a6e0c3026` | 700 bytes；SHA-256 `023656fdf6324f95ce6e177ab8f7bc65de6aa7d0c1b145b5fd7d9299619e3c3c` |

因此，当前默认最新官方宿主仍不能恢复这个由其公开 append 接口写出的外部事件。普通会话的成功对照排除了“宿主完全不能启动或持久化”的解释。这里只证明该必要事件协议缺口；没有进行完整 novel-agent 迁移、浏览器视觉/Slot 验收或社区 Desktop 安装。

## `0.1.3-alpha.2` 的安装与启动界限

完整依赖树和 Profile 内诊断插件均已安装；启动在 JSONL persistence 插件加载阶段退出，未产生监听地址：

```text
Cannot find module './build/Release/fs_ext.node'
```

这是初次禁用安装脚本后缺失的 `fs-ext@2.1.1` 原生产物，不能单凭该错误断言 alpha 不支持 Windows。已读取其 manifest、README、binding.gyp 和 Windows 源码分支；许可证在旧式 `licenses` 字段中声明 MIT，安装脚本为 `node-gyp configure build`。

在 alpha 自己的配置中允许此构建后，执行 `pnpm rebuild fs-ext`：

1. 首次因为找不到 Python 失败。
2. 用现有 Codex runtime 的 Python `3.12.14` 再运行，node-gyp `12.4.0` 成功识别 Python；Node `24.20.0` 头文件及 SHASUMS 下载 HTTP 200。
3. 下载 `win-x64/node.lib` 时连接 `nodejs.org:443` 超时，构建退出，未得到 `fs_ext.node`。

只读检查还显示：PATH 没有 `cl.exe` / `vswhere.exe`，常见 Visual Studio 与 Windows Kits 目录不存在。没有安装全局编译工具，也没有证据证明本机具备另一套可用 C++ 工具链。下载失败属于当前环境构建障碍，尚未到达 alpha 的 Host 恢复测试。

同时检查了官方预编译载体：

- [PyPI runtime 元数据](https://pypi.org/pypi/deepseek-harness-runtime-bin/json)最高为 `0.1.2rc1`，没有 `0.1.3a2` 或 `0.1.3-alpha.2`。
- [alpha Release API](https://api.github.com/repos/deepseek-ai/deepseek-harness/releases/tags/dsh-v0.1.3-alpha.2)返回空资产列表。
- 官方 rc.1 Windows wheel 确实存在；其[同 tag 入口](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/dsh-v0.1.2-rc.1/python/sdk-runtime/pyproject.toml)和[运行说明](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/dsh-v0.1.2-rc.1/python/sdk-runtime/README.md)支持正常 `dsh --profile web`。它不能充当 alpha 的同版本试验载体，本轮未下载或混用。

alpha 的真实 writer/reader **包级**反证仍见前一份报告，但不能升级为完整宿主反证。

## 收尾与尚未完成的工作

2026-09-08 16:40 的普通本机只读检查确认：本次完整 runtime 的 Node Host 和 HTTP 客户端进程为 0；49406、59238、52611 均无监听；用户全局 `.dsh` 不存在。自定义日志哈希再次核对一致。旧试跑的临时进程均已停止，alpha 没有启动成功的 Host。

网络诊断只读取了当前代理/监听状态，重试使用子进程环境；没有关闭 TLS 验证或改变全局代理。失败的手动下载被标记为 `.incomplete`，未作为安装来源。完整依赖安装最终成功不代表所有原生脚本或全部产品功能已验证。

本轮没有产品源码修改，所以未重复此前已通过的 244 个包测试。已新增完整宿主反证，并保留 alpha 启动未完成的事实。没有通过恢复条件的新版可供正式采用；M1、自定义事件冷恢复、领域拆包、真实模型和 12 章验收仍未完成。
