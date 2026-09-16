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
