# 审批渲染者 RED 证据 — 2026-09-17（I1.1）

**结论先行：计划 §Phase 1 的前提被证伪。官方存在一个**独立的**审批客户端包
`@deepseek-ai/dsh-client-ui-approval`，它在本仓库的 novel profile 里**已被加载并执行**，
而且**我们的 bundle patch 没有禁用它**。** 它同时是 `approval/request` 瀑布的应答者，
并把审批面板渲染进 `conversation.composer` —— 正是我们保留的那个会话面。

**因此这不是「回归」，也不是「从未有过」，而是「一直有，而且现在是开着的」。**
按 §5 停下，等用户决定是否还要自研审批卡（I1.2/I1.3）。

---

## 1. 计划原本的前提（原文）

> I1.1 … 已知事实：`dsh-user-approval` 无客户端半边；整个 `@deepseek-ai/` 里客户端提到
> approval 的只有 `dsh-client-ui-chat`，而它被我们的 bundle patch 禁用。

> 决定 5：**审批卡自研，排在最前** —— 官方审批只由被我们禁用的 `ui-chat` 提供，可能是回归。

**这个「已知事实」是从仓库的 `node_modules/` 推出来的，而仓库的 `node_modules/` 里根本没有
DSH profile 的那批客户端包。** `dsh-client-ui-approval` 存在于 DSH 安装与 profile 里，
不在 workspace 依赖里，所以按仓库 `node_modules/` 去 grep「谁提到 approval」必然漏掉它。
（与 I0.2 漏掉 `react-dom` 是同一类错误：**清单取错根目录，结论就会反向**。）

---

## 2. 证据

### 2.1 宿主下发的前端模块清单（服务端事实）

从运行中的 Host 取根 HTML（`.novel-agent/run/host.url` 带 token），preload 清单里含有：

```
/plugins/??…@deepseek-ai/dsh-client-ui-conversation/client.js,
          @deepseek-ai/dsh-client-ui-approval/client.js,…&rev=…
```

并在模块 manifest 里带自己的版本与依赖：

```json
{"id":"@deepseek-ai/dsh-client-ui-approval",
 "url":"/plugins/??@deepseek-ai/dsh-client-ui-approval/client.js&rev=d7ab0d02e937c5a6-19",
 "rev":"d7ab0d02e937c5a6-19",
 "inject":["@deepseek-ai/dsh-api-remotes","@deepseek-ai/dsh-api-session-controller",
           "@deepseek-ai/dsh-client-locale","@deepseek-ai/dsh-client-ui-conversation",
           "@deepseek-ai/dsh-client-ui-renderer","@deepseek-ai/dsh-client-ui-session"]}
```

我们的 patch（`packages/novel-workbench/cordis.patch.yml`）禁用的是 `ui-layout`、`ui-sidebar`、
`ui-chat` 三项，**没有** `ui-approval`。

### 2.2 该包的实际代码（11,683 B，从 Host 取回）

```js
ctx.slots.inject("conversation.composer", () => ctx.slots.register({
  name: "conversation.composer",
  priority: 1,
  select: ({ pendingInteraction }) =>
    pendingInteraction instanceof PendingApproval ? pendingInteraction : null,
  locale: NS,
  children: { "conversation.approval.detail": { kind: "single", scope: "session" } }
}, ApprovalPanel))
ctx.remote.$on("approval/request", function (request, next) {
  return answerApproval(ctx, this, request, next, registerPendingInteraction)
})
```

三个要点：

1. **它自己声明 `conversation.approval.detail` 槽**（作为 `conversation.composer` 的子槽）。
   `ui-chat` 那句 `ctx.slots.inject("conversation.approval.detail", …)` 只是往**这个**槽里
   注入一个命令预览组件——禁用它丢的是「审批时把那行命令显示出来」，**不是审批卡本身**。
2. **它渲染 `ApprovalPanel`**，选择条件是「存在 pending approval 交互」，挂载点是 `conversation.composer`。
3. **它是客户端应答者**：`ctx.remote.$on("approval/request", …)`；会话不在作用域内时
   `return next()` 交给下一个应答者（瀑布语义）。

### 2.3 真机 DOM / 网络（浏览器事实）

复现：`scripts/dev-host.sh start` 后

```bash
node docs/evidence/approval-red-2026-09-17/probe.mjs /tmp/approval-red
```

结果（原文存 `docs/evidence/approval-red-2026-09-17/summary.json`）：

| 观测 | 值 |
| --- | --- |
| `dsh-client-ui-approval/client.js` 返回 | **HTTP 200** |
| 该模块与 `@novel-agent/novel-workbench/client.js` 是否同批加载 | **是**（同一个 `/plugins/??…` 请求） |
| `[data-novel-workbench="frame"]` 是否渲染 | 是 |
| DOM 里是否存在 `data-slot="conversation.composer"` | **是**（审批面板的挂载座位存在） |
| DOM 里是否存在 `data-slot="conversation"` 及其子槽 | 是（`conversation.session.header`、`conversation.input.dock`、`conversation.composer.bar` 等 22 个槽） |
| `approval` 相关 DOM 节点数 | **0** |
| 浏览器 console 报错 | **0** |

`approval` 节点为 0 **是预期的**：当前没有 pending approval，`select` 返回 `null`，面板不渲染。

### 2.4 `approval/request` 瀑布的语义（旁证）

`@deepseek-ai/dsh-user-approval` 的 types 写明：结果闭集为
`'allowed-once' | 'rejected' | 'cancelled' | 'unavailable'`，**且 fail-closed**——
「Callers fail closed on `unavailable`」。也就是说：**没有应答者时操作会被拒绝，而不是卡住**。
这与「批准不了的卡死」是不同的失效模式，后续真机验证要按这个预期去看。

---

## 3. 分类：回归 / 从未有过 / 一直有

| 候选 | 证据 | 判定 |
| --- | --- | --- |
| 我们改出来的回归 | patch 只禁 `ui-layout`/`ui-sidebar`/`ui-chat`；`ui-approval` 仍 200 加载 | ✗ |
| 官方从未提供 | 存在独立包且已加载 | ✗ |
| **一直有、现在也开着** | §2.1–2.3 | **✓** |

---

## 4. 仍未证明的部分（不得当成已验证）

- **没有**驱动过一次真正需要审批的操作。本轮的 RED 只证明「渲染者已被加载、座位存在」，
  **不等于**「真实 pending approval 时面板会画出来」。
- 触发一次真审批需要一次带工具调用的真实会话（需要模型），本轮未跑。`dsh --profile headless`
  只给终端审批，证明不了 **web** 面板。
- 因此下列问题**仍未回答**，且需要先有用户的方向才好设计实验：
  - 我们的 frame 是否让 `conversation.composer` 的**可见尺寸**足够（它是 `display: contents`，
    真正的位置由会话面决定）？
  - 我们自研的 `novel.composer` 底部行与官方 composer 是否叠加/遮挡？

---

## 5. 为什么这是 §5 的停止点

计划 §5 明确列了一条：

> 发现「审批回归」不是回归、而是官方从未提供 → 需要用户决定是否自建。

本轮是它的同类情形，而且更强：**前提反了**。若继续按 I1.2 自研审批卡，会直接违反 §2 的
「**不建第二套** Agent / Session / Workspace / 事件 / **审批** / 权限 / …」，因为官方那一套
本来就在跑。

### 裁定结果（2026-09-17）

用户选择 **① 撤销 I1.2/I1.3 的自研，改为「验证并修好复用路径」**。计划 Phase 1 已按此重写：
I1.2 变成「真机验证官方 `ApprovalPanel` 在我们 frame 里可用」，I1.3 变成「修复用路径的 frame 侧缺陷」。
**不自研审批卡**，因此 §2「不建第二套 …审批…」不需要豁免。

### 供用户选的走法（历史记录）

1. **撤销 I1.2/I1.3，改为「验证并修好复用路径」**（推荐）：先跑一次真审批，确认官方面板在
   我们的 frame 里能画出来且能应答；画不出来就修 frame 的座位/几何，而不是另造一张卡。
2. **保留 I1.2，但降级为「外观与作者语言」**：复用官方应答与数据通路，只改 `ApprovalPanel`
   的呈现（我们自己的文案/样式）。注意这仍然要往官方槽里注册，属于覆盖而非第二套。
3. **照原计划自研整张卡**：与官方并存或替换掉它。需要说明为什么官方那张不够——目前没有任何
   证据支持这一点。
4. **先只做真机验证**：本轮先补「一次真实审批」的实验，拿到结果再决定 1/2/3。

---

## 6. 复现命令

```bash
cd /Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent
scripts/dev-host.sh start                       # 或 rebuild
node docs/evidence/approval-red-2026-09-17/probe.mjs /tmp/approval-red

# 服务端清单：根 HTML 里的 preload 列表与 manifest
US=$(cat .novel-agent/run/host.url); J=/tmp/dsh-cookies.txt
curl -s -L -c $J -b $J "$US" -o /tmp/host-root.html
grep -o '.\{160\}dsh-client-ui-approval.\{200\}' /tmp/host-root.html

# 该包源码
BASE=${US%%/\?*}
curl -s -b $J "$BASE/plugins/??@deepseek-ai/dsh-client-ui-approval/client.js&rev=d7ab0d02e937c5a6-19" \
  -o /tmp/ui-approval-client.js && wc -c /tmp/ui-approval-client.js
```

---

## 7. 续（2026-09-17）：用官方 fixture 做无模型 RED

### 7.1 方法：一个 URL 开关就能造出真的 pending 审批

`dsh-client-connection` 的客户端半边自带一套内存 fixture，**只由 URL query 决定**：

```js
const fixtureRpc = pageLocation !== undefined &&
  new URLSearchParams(pageLocation.search).has("fixture")
  ? createFixtureConnectionRpc() : void 0
```

只要页面 URL 带 `fixture`（值不是 `empty`），整个连接层就换成内存世界，并在事件流打开时吐出**真实的
pending 瀑布调用**：

```js
const approvalInvocation = () => ({ type: "waterfall", event: "approval/request",
  eventId: "fx-interaction-approval", agentId: sid("fx-alpha"),
  request: { toolName: "dangerous_tool", reason: "fixture 常驻审批（可答：批准/拒绝后消失）" } })
const questionInvocation = () => ({ type: "waterfall", event: "user-questions/request",
  eventId: "fx-interaction-question", agentId: sid("fx-alpha"), request: { questions: fixtureQuestions } })
```

**这就给了「不需要模型、不需要真实工具调用」的 pending 审批**，是验证审批 UI 的最便宜入口。

> ⚠️ **坑：** token URL 会 **303 到裸 `/`**，`fixture` 会被丢掉。必须先导航一次 token URL 拿到 cookie，
> 再导航到 `http://127.0.0.1:4780/?fixture=1`。探针已经这么做。

### 7.2 观测结果（可复现，3 次运行）

复现：

```bash
node docs/evidence/approval-red-2026-09-17/probe-fixture-approval.mjs /tmp/approval-fixture
```

产物：`docs/evidence/approval-red-2026-09-17/fixture-summary.json`、`fixture-before.png`。

| 观测 | 结果 |
| --- | --- |
| frame 是否渲染 | 是 |
| fixture 是否真的生效 | 是（作品名变 `fixture`，线程 4 条，报错都指向未实现的 fixture RPC） |
| 选中 fixture 会话后，**官方 user-questions 待答面板** | **渲染进 `conversation.composer`**（「偏好 / 你现在更想招哪类 Agent/Harness 候选人？…1/3」） |
| **官方审批面板** | **没有出现**（`approvalDetailSlot=false`，`approvalishNodes=0`，正文里没有「常驻审批」） |
| console 报错 | 6 条，**全部**是 fixture 未实现的 `dynamicCordisRunner/*`，**没有一条**和 approval / 插件应用失败有关 |

**两者 agent 作用域完全相同**（都是 `sid("fx-alpha")`），所以差异不是会话作用域造成的；
先选会话再加载、先加载再选会话两种顺序都试过，结果一致。

### 7.3 这条证据的边界（重要）

- **这不是「真实操作」**，是官方自己的开发 fixture。它回答的是**UI 那一半**：
  「官方 pending 交互能不能画进我们的 frame」。
- 它**证明**：我们的 frame 给官方 pending 交互留的座位是**通的**（questions 面板确实画出来了）。
- 它**没有证明** `ui-approval` 坏了。目前只是一条**可复现但未解释**的差异，不是缺陷结论。
  未排除的替代解释至少有：fixture 先自行决定了那条审批；两个包 `registerPendingInteraction`
  的竞争顺序不同；`ui-approval` 的 `select` 判据 `instanceof PendingApproval` 在这个路径上取不到值。

### 7.4 下一步诊断（下一轮从这里接着做）

1. 在页面里直接看 `ui-approval` 的 `apply()` 有没有跑起来（它的 locale 命名空间 / 槽注册是否生效），
   而不是只看模块有没有被 fetch。
2. 把 `approval/request` 与 `user-questions/request` 两条瀑布在 fixture 下的**投递顺序与应答者**
   对比出来，确定差异发生在「有没有投递」还是「投递了没人认领」。
3. 如果 fixture 路径确认是它自己的 artifact，再上**真实审批**（需要模型）做终局确认。

**在 1–3 出结果之前，不得把本条当成「官方审批在我们 frame 里坏了」。**

---

## 8. 差分实验（2026-09-17 续）：差异不在我们的 frame 里

§7.4 第 ① 步的正确做法不是给我们自己的代码加探针，而是**做差分**：官方 `web` profile 里
`ui-approval` 同样在场，但**完全没有我们的 frame 与 patch**。同一个 fixture、同一个会话、
同一份探针代码，两边跑一遍即可判定。

```bash
# 起第二个宿主：官方 web profile，同一个 DSH_HOME，另开端口，不碰用户全局 ~/.dsh
NOVEL_AGENT_DEV_HOME="$PWD/.novel-agent/web-run" DSH_HOME="$PWD/.novel-agent/dsh-home" \
  DSH_PROFILE=web DSH_PORT=4790 scripts/dev-host.sh start

WEBURL=$(cat "$PWD/.novel-agent/web-run/run/host.url")
node docs/evidence/approval-red-2026-09-17/probe-fixture-approval.mjs /tmp/web-fixture --url "$WEBURL"
# 收尾
NOVEL_AGENT_DEV_HOME="$PWD/.novel-agent/web-run" DSH_HOME="$PWD/.novel-agent/dsh-home" \
  DSH_PROFILE=web DSH_PORT=4790 scripts/dev-host.sh stop
```

产物：`docs/evidence/approval-red-2026-09-17/web-fixture-summary.json`、`web-fixture-before.png`。

| 观测（fixture 打开、会话已选） | 我们的 novel frame | 官方 web frame |
| --- | --- | --- |
| frame 渲染 | 是（`data-novel-workbench="frame"`） | 是（无我们的 frame，`hasFrame=false`） |
| 会话已选中 | 是（`Fixture 历史会话`） | 是（`等待回答 / Fixture 历史会话`） |
| **官方 user-questions 待答面板** | **渲染** | **渲染** |
| **官方审批面板** | **没有** | **没有** |
| `approvalishNodes` | 0 | 0 |

### 8.1 结论：§7.2 的差异是 fixture 的性质，不是我们的缺陷

**两边行为完全一致。** 官方 web frame 里没有任何我方代码参与，审批面板同样不出现。
所以不能把 §7.2 那条不对称归因到我们的 frame、patch 或座位安排上。

**据此撤回 §7.3 那条线索的「可能是我们坏了」那一读法。** 更可能的解释是 fixture 路径本身
不产生一个可被认领的 `PendingApproval`（例如它在客户端认领之前就被判定，或这条 fixture 的
审批走的是与 questions 不同的认领条件）。

### 8.2 由此得到的硬结论

**fixture 这条捷径无法回答「官方审批面板在我们 frame 里能不能画出来」。**
它能证明的只有「官方 pending 交互的座位在我们 frame 里是通的」（questions 已证），
**审批那一条必须走真实审批**。

### 8.3 §7.4 三步的结账

| 步骤 | 状态 |
| --- | --- |
| ① 确认 `ui-approval` 的 `apply()` 有没有跑 | **不再需要**：差分显示即使跑起来，fixture 下两边都不画，问题不在 apply |
| ② 对比两条瀑布的投递/认领差异 | **已由差分替代**：差异与我们的 frame 无关，深挖 fixture 内部对本次目标没有收益 |
| ③ 确认 fixture 不是 artifact 之后上真实审批 | **③ 的前半已确认：它是 artifact。** 因此真实审批成为唯一剩下的路径 |

**成本提示：** 真实审批需要一次带工具调用的**真实模型会话**（会产生模型调用费用），
是本计划里第一个真正消耗模型额度的动作。这一步不免费。

---

## 9. 真实审批（2026-09-17）：官方面板在我们 frame 里**正常工作**

用户授权后跑了真实模型会话。**结论：复用路径可用，没有缺陷，I1.3 没有要修的东西。**

### 9.1 方法

```bash
node docs/evidence/approval-red-2026-09-17/probe-real-approval.mjs --explore     # 只 dump，不发送
node docs/evidence/approval-red-2026-09-17/probe-real-approval.mjs --out DIR \
  --answer reject  --send "<越界写入的提示>"
node docs/evidence/approval-red-2026-09-17/probe-real-approval.mjs --out DIR \
  --answer approve --send "<同一条提示>"
```

探针的安全设计（写进计划后才执行）：**默认只拒绝**；只有触发操作**被证明无害**时才测批准半边，
且测完立刻清理。触发方式是让模型做一次**会话工作区之外**的写入 —— 默认预设 `workspace-write`
的语义正是「工作区内写免批，更宽的写入重试需要审批」，所以**不需要真的做任何危险操作**。

两个操作细节值得记下（都卡过一轮）：
- composer 是自定义 `contenteditable`，**`.focus()` 不够**，要用真实鼠标事件点击才拿到焦点；
- 会话座位在其他视图里也在 DOM 中但**尺寸为 0**，必须先点 rail 的 `threads` 段再点线程行，
  等 composer 真有 `getBoundingClientRect()` 尺寸才发得出去。探针现在用「宽度 > 50」当就绪判据，
  并在打字为空时**拒绝发送**（避免发空回合）。

### 9.2 四条断言（真实会话，两轮）

| 断言 | 观测 | 结果 |
| --- | --- | --- |
| **(a) 面板在我们 frame 里画出来** | `data-slot="conversation.approval.detail"` **存在**，`approvalishNodes=2` | ✅ |
| **(b) 展示要批准的具体内容** | composer 里逐字出现：「等待审批 / escalate sandbox to danger-full-access: 目标路径 /Users/wzy/novel-approval-probe.txt 在会话工作区之外，写入需要放宽到工作区外访问权限。」+ 两个动作「拒绝」「允许一次」 | ✅ |
| **(c) 拒绝 → 操作中止** | 点「拒绝」后面板消失、composer 复位；**`/Users/wzy/novel-approval-probe.txt` 始终不存在** | ✅ |
| **(c) 批准 → 操作继续** | 点「允许一次」后面板消失；**文件真的出现了**（`ok`，3 字节，`-rw-------`） | ✅ |
| **(d) Esc 不等价于批准** | 按 Esc 后 `approvalDetailSlot` **仍为 true**，文案一字未变，审批仍挂起 | ✅ |

**清理：** 批准那轮产生的 `/Users/wzy/novel-approval-probe.txt` 已删除并复验不存在；
两轮用的都是**新线程**，没有动既有线程；没有碰 `~/.dsh`；没有改权限预设；没有碰 Canon。

### 9.3 结论与边界

- **结论：官方审批 UI 在我们的 frame 里渲染、应答、并且真的能拦住和放行操作。**
  之前 §7/§8 那条 fixture 不对称与我们的 frame 无关，这里也不再重要 —— 真实路径是通的。
- **边界（不得过度声称）：** 这是**真实审批**，但触发是**我们挑的一个合成操作**（一次越界小文件写入）。
  它没有覆盖全部工具类型；也没有证明审批在长会话、多审批并发、或审批超时下的表现。
- **一处观察：** 两轮里 `reason` 文案一轮中文、一轮英文（模型生成），说明该文案不是固定翻译。
  若将来要按作者语言统一审批文案，那是**改呈现**的事，属于用户此前未选的选项 ②，不在本次范围。
