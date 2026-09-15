# 作者 Remote 的原生会话恢复 — 2026-09-08

**本切片结果：已验证本地修复与全新 Web Profile 集成；M1 自定义事件冷恢复仍 blocked。**

## 行为与实现

原实现只在内存 AgentRegistry 查找作者。已有磁盘会话的 Agent 被释放后，作者预览会报 `live DSH Agent 'cold-author-preview' does not exist`。

现在 `reviewDraft`、`previewReview`、`review`、`rollback` 保留 `sessionId: string` 的 Remote wire，直接调用 DSH 已注册的 `agent` lookup provider。Host 的原生 resolver 负责复用/恢复 Agent、原身份和 preset；小说代码继续绑定 Workspace、作者 provenance 与授权，不复制恢复算法，不发送用于激活会话的模型消息。

实现见 [Host](../packages/novel-project/src/index.ts)；`static inject` 声明 `typert`，旧的手工 `requireAgent` 已移除。

直接把 `agent: Agent` 写入 Remote 参数时，发布版 rc.2 generator 报 `lookup and Context wire types must be named public types`。源码核查确认其仅认识工作区注册的公开 wire 类型。采用 `ctx.typert.lookups.get('agent').resolve(...)` 是公开运行时入口，返回的 provider 使用 Host 已配置 resolver，保持现有 wire。现有 [generator-only façade](../packages/novel-project/build/typert-protocol.meta.d.ts) 只补齐该 public registry 形状；普通 TypeScript 检查仍使用原样 npm 类型，没有修改 DSH 或手写生成产物。

## RED / GREEN 与包级检查

[focused test](../packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts) 使用真实 AgentLoop 与 JSONL backend：创建空 seed 的原生会话，flush 后释放 Agent/Session，确认内存不可见而持久化列表仍存在，然后调用生成的 `previewReview`。

- RED（12:56）：`live DSH Agent 'cold-author-preview' does not exist`。
- GREEN（13:11）：同一 Session ID 被恢复，状态 idle，无 `turn/start`，预览 R0 → R1，Canon 仍为 R0。
- `corepack pnpm test:focused`：5 文件，**244/244**，11.47s。
- `corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm --filter @novel-agent/novel-project build`：通过。
- medium R003 独立复核 source、wire、façade、依赖和 focused proof，无具体问题；主线程核对最终命令结果。

仅新增 `dsh-session-persistence` 与 `dsh-session-persistence-jsonl` 两个精确 rc.2 **开发依赖**。其 Windows backend 带入 Koffi `3.2.1` 及同版本预构建包；DSH、Koffi、Node API headers / node-addon-api 的相关许可证均为 MIT。安装脚本保持禁用，根 pnpm-workspace.yaml 未变。Core/Narrative 夹具加载实际 TypertRegistry 来满足明确的服务依赖，未弱化既有断言。

## 全新 Profile 与完整 Host 重启

证据目录：`.novel-agent/acceptance/native-lookup-20260908/`；[run.json](../.novel-agent/acceptance/native-lookup-20260908/run.json) 保存准确路径、身份和哈希。

1. 从本轮构建执行 `corepack pnpm --dir packages/novel-project pack --pack-destination …`，15 文件 tgz 的 SHA-256 为 `e4fb687c3f9be006f448013e7fd430fa3d20ea3a20203074b9287f899020f04d`。
2. 用已准备 CLI `0.1.1-rc.2` 在全新 DSH_HOME 执行 `plugin --profile web add --ignore-scripts <tgz>`，安装成功。Profile 的 21 个 DSH manifest 均为 `0.1.1-rc.2`。
3. 使用官方 `workspace.create` / `session.create` 创建专用工作区。Web 执行只读 `/goal`，只产生内置命令事件。小说面板预览草稿，未点击 Apply。
4. 停止端口 `65391` 的 Host，确认无监听，再以同一 Home 从全新进程启动端口 `62031` 的 Host。打开原会话，在 `conversation.view` 重新载入同一草稿并预览，来源仍指向原 Session ID。
5. Canon 始终为 R0，前后文件 SHA-256 均为 `7a266b897a96a439cd29c76ab5d63c6dbcc4d0406acbd91fea1b8646d8651b7d`。
6. 原生连续 zstd 帧解码确认日志从 6 条记录增至 7 条，只增加 `session/end-seed`。没有模型轮次或 `novel/canon/*` 事件。两个 Host 已停止、两个端口均释放、临时验收标签已关闭。用户全局 `.dsh` 仍不存在。

**实际证据边界：**Web 在点击 Preview 前已完成原生恢复，旧日志哈希也在此时变化。因此这个 UI smoke 证明“完整 Host 重启后，原会话的作者预览可用”；不能声称 UI 中的 Preview 是唯一恢复触发点。直接由 Remote 触发冷恢复的证据来自前面的实际 JSONL / AgentLoop focused test。

最终 origin 没有观察到 console warning/error；旧 origin 留有 17 条已停止连接的 warning，没有计入最终 origin。目录选择器未在当前浏览器 surface 完成操作，因此工作区通过官方 API 创建；未修改通用目录选择功能。

## 剩余边界

此修复没有给 SessionEvent 加兼容性标记。原 M1 R3 Canon 文件哈希仍为 `72649e86ca48eb0910b44f13ba81eebb14fabe6524cfb11add0ea469241264cb`；旧未知事件日志保持原样。官方新版仍未提供必要 writer，详见 [版本评估](open-source-evaluations/dsh-session-event-upgrade-2026-09-08.md)。

完整领域插件拆分、真实模型质量、前 12 章、Desktop Windows 生命周期、CI、生产和作者验收仍未完成。本切片没有提交、推送、发布或部署。
