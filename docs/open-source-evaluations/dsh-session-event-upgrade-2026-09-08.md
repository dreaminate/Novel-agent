# DSH 官方版本升级评估 — 2026-09-08

**决定：尚无通过本次必要事件接口验证的升级候选，未修改产品依赖。** 用户已允许评估并采用通过验证的官方 DSH 及配套宿主版本；这取代原来的版本钉死限制，其余 Canon、Session、上游只读和真实恢复要求不变。

**后续用户决策：**用户在知晓恢复结果后明确指定使用 rc.1。[实际采用记录](dsh-0.1.2-rc.1-adoption-2026-09-08.md)已完成该版本迁移；本报告保留原评估阶段的结果，必要事件门禁仍未通过。任何未来 marker 方案须限制到可由权威 Revision 重建的派生通知，不能一概用于预算等 log-only 事实。

本次只评估解除 M1 的自定义会话事件恢复阻塞。不是完整版本迁移、Desktop 安装或小说功能验收。

**后续完整宿主试跑：**[2026-09-08 实测报告](../dsh-full-host-upgrade-trial-2026-09-08.md)补充了 `0.1.2-rc.1` 全新 Web Host 的安装、Remote、完整重启和恢复证据：普通会话通过，自定义事件仍失败。`0.1.3-alpha.2` 完整依赖树已安装，但 `fs-ext` 构建受阻，宿主尚未启动；本报告中的 alpha 包级反证不等于其宿主已跑通。

## 官方版本与来源

| 候选 | 官方发布与精确提交 | 观察结果 |
| --- | --- | --- |
| DSH `0.1.2-rc.1` | [Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-rc.1)，`a66e4702047846cdaa10c66c9d3df3951f5ea70d` | npm `latest` / `next`；CLI 包于 2026-09-03 发布。会话 writer 仍不能写 `ignorable`，reader 仍拒绝未标记的外部事件。 |
| DSH `0.1.3-alpha.2` | [Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.3-alpha.2)，`82a5fd61a7cf5c293cec4bdff68f455398d685e9` | npm `alpha`；CLI 包于 2026-09-07 发布。隔离真实包的 append → reader 检查复现同一拒绝。 |
| 社区 DSH Desktop `v2.0.5` | [Release](https://github.com/anywhere-labs/dsh-desktop/releases/tag/v2.0.5)，`423406fe225442995902015cb6f10eed670ff115` | 社区维护的稳定版，声明配套 DSH `0.1.2-rc.1`，不是 DeepSeek 官方桌面产品。核心事件接口先未通过，未安装宿主。 |

官方 npm 元数据、四个 tarball 与解包内容保存在 `.novel-agent/upstream-evaluation/2026-09-08/`。每个 tarball 都与 registry 的 SHA-512 integrity 逐字节校验一致；只读取发布包，没有修改上游归档。四包 manifest 均声明 MIT，未带 preinstall/install/postinstall。

| 下载包 | tarball SHA-256 |
| --- | --- |
| `dsh-session@0.1.2-rc.1` | `8aa3706f71f1ae8d27c3af955d73f0ff94a09fbc8956512dc71d03c004a80dd3` |
| `dsh-session-persistence@0.1.2-rc.1` | `f24a58a7077b2047352855c7415812928511f012a82b2331308f8de65aa4e01a` |
| `dsh-session@0.1.3-alpha.2` | `34a33c0d51e1fe58620fe7e82ce65b95b572bb18862d3d98e76d42277b932dc6` |
| `dsh-session-persistence@0.1.3-alpha.2` | `86670cdc1b5e143f3188818e5e622ef9d365f7c236b85420955dbbfe4fce3a98` |

## 实际发布接口

以下路径均相对于上述评估目录中的对应 `<package>-<version>/package/`：

- `dsh-session@0.1.2-rc.1/lib/types/index.d.ts:233`、`dsh-session@0.1.3-alpha.2/lib/types/index.d.ts:236`：`append` 仍只公开 type/data，只有 surface 事件接受额外参数；没有 `ignorable` 写入参数。
- 两版 `dsh-session/lib/types/index.js` 的 `append` 实现（531 / 532 行开始）都重新构造并冻结事件信封，没有写入 `ignorable`。在 payload 中增加同名字段不能改变信封。
- 两版 `dsh-session/lib/types/known-event-types.d.ts:15-20` 的说明已从旧 rc.2 的“注册接口延后”改为：外部事件使用持久化 marker，按名称注册被上游否决，因为它无法判断遗漏是否安全并会使恢复依赖插件组合。这一说明不等于 marker writer 已经存在。
- `dsh-session-persistence@0.1.2-rc.1/lib/index.js:1297-1300`：恢复仍拒绝不在静态目录中且没有 marker 的事件。
- `dsh-session-persistence@0.1.3-alpha.2/lib/index.js:182-185`：公开 `validateStoredEvents` 执行相同门禁。

因此不能仅把全部依赖改成新版本就宣称恢复问题解决。`0.1.3` 还改变了 SessionHandle 生命周期、Session 读取方式和异步 Agent 创建，存在额外迁移工作；在必要接口未通过时不开始这项迁移。

## 隔离真实包验证

在评估目录的 `runtime-alpha2/` 创建独立 package.json，显式依赖 Cordis `4.0.2`、Session 与 Session Persistence `0.1.3-alpha.2`，运行：

```powershell
corepack pnpm --ignore-workspace install --ignore-scripts
```

安装成功，15 个依赖的 manifest 均为 MIT，均无 preinstall/install/postinstall。10 个实际 DSH 包均解析为 `0.1.3-alpha.2`；未借用 rc.2 依赖来运行候选。pnpm 自动在**隔离目录**写入该批精确版本的 `minimumReleaseAgeExclude`，根 pnpm-workspace.yaml 保持原内容。

用真实发布模块执行以下最小验证（在该独立目录运行 `node --input-type=module`）：

```js
import assert from 'node:assert/strict';
import { Session, SessionId } from '@deepseek-ai/dsh-session';
import { validateStoredEvents } from '@deepseek-ai/dsh-session-persistence';

const session = Session.create(SessionId('novel-event-probe'));
const event = session.append('novel/canon/accepted', {
  projectId: 'probe-project', revision: 1,
  deltaRefs: ['probe-delta'], sourceSessionId: session.id,
});
assert.equal(event.ignorable, undefined);
assert.throws(
  () => validateStoredEvents({ id: session.id }, JSON.parse(JSON.stringify([event]))),
  { name: 'SessionFormatUnsupportedError' },
);
const control = Session.create(SessionId('known-event-control'));
const known = control.append('session/end-seed', {});
validateStoredEvents({ id: control.id }, JSON.parse(JSON.stringify([known])));
```

最终命令 exit 0：自定义事件被原生 reader 拒绝，内置事件对照通过；实际 append 返回的事件已冻结且没有 marker。原始拒绝为：

```text
SessionFormatUnsupportedError: ... "novel/canon/accepted" (seq 0)
unknown to this harness and not marked ignorable; refusing to interpret the log
```

**证明边界：**这是官方发布模块的 writer / reader 行为验证，不是完整 DSH_HOME、磁盘、Remote、Slot 或 Desktop cold smoke。它已经反证该必要条件；没有把预期拒绝测试的绿色退出当作产品恢复成功。

探针的首次尝试沿用了旧版 `session.events` 读取方式而失败，随后改为使用 append 的真实返回值；一次结果文件写入受到 EPERM 阻止。最终纯 stdout 验证成功。无效命令和文件写入错误均未计作产品 RED。下载时的受限进程 TLS 错误，通过获准的普通进程读取官方公开包解决，未修改网络配置。

## 配套 Desktop 的界限

社区 `v2.0.5` 的 [tagged manifest](https://github.com/anywhere-labs/dsh-desktop/blob/v2.0.5/dsh-plugin-desktop/package.json) 钉死 DSH `0.1.2-rc.1`；[许可证](https://github.com/anywhere-labs/dsh-desktop/blob/v2.0.5/LICENSE) 为 MIT。官方 Windows x64 [安装器](https://github.com/anywhere-labs/dsh-desktop/releases/download/v2.0.5/DSH-Desktop-2.0.5-x64-Setup.exe) 的资产列表标注 SHA-256 `777cb50c86b06d194b3029afebe9d06c9306ac521b82334c88cd4f1a0104220d`；本轮没有下载或安装它。

独立源码核对显示宿主沿用 `DSH_HOME`，Electron 自身状态还需隔离 `--user-data-dir`。Safe Mode 会在后续启动清理其数据，不用它保存持续验收证据。稳定版与 Beta 共享配置的官方说明不构成隔离证明。Windows UI、可访问性、生命周期、运行成本和小说插件兼容性本轮均未验收；因为依赖的事件接口已未通过，没有推进到宿主 UI gate。

## 保留与下一步

独立 high 复核 R002 与主线程一致：seed/import 只能接收已经构造好的信封，不能给现有 live Session 追加并发布动作事件。alpha 的 SessionHandle 由 Agent Loop 在发布前取得写入所有权，第二次 write open 会拒绝；绕过 live Session 直接写 storage 会使 log 序号、observer 和 projection 不一致。rc.1 的低层 persistence.append 也不是替代入口。

### 可审阅的最小接口方案（未实施）

若官方补齐此能力，或用户另行明确允许在本仓库维护一个本地补丁，改动限定为 `dsh-session` 的非 surface `Session.append`：

- 增加可选的 `LogEventIntent`，其唯一字段为 `readonly ignorable: true`；省略 intent 时保持现有 required 语义。
- 在原有事件构造与冻结之前，把显式 marker 放入信封；沿用原 Session seq/time、`session/event` 发布和 persistence flush。
- surface 事件维持既有参数与语义；不修改 known-event set、不增加事件总线、不绕过 live Session 写磁盘、不修改参考 checkout 或 Agent Loop。
- 验证先证明当前 API 缺失，再证明带 marker 的扩展事件能由官方 backend 保存、读取并继续同 ID 会话，且原始事件仍可审计；未标记事件仍按现状拒绝。随后完成 novel-agent Remote、Slot 和全新隔离 Profile 的接受/回滚/冷恢复验证。

本地补丁不是原样官方发布包，所以不属于用户当前“采用通过验证的官方版本”授权。只有新的明确授权才能采用这条路线。

版本评估授权已经生效，当前缺口不再是等待允许升级。当前产品 manifest、lockfile、已准备 runtime、用户全局 `.dsh`、原 rc.2 RED 日志均保持。没有新增产品依赖或重新分发上游组件，THIRD_PARTY_NOTICES 无新增采用项。

后续在等待补丁决策期间完成了一个独立的 [作者会话恢复修复](../native-author-session-lookup-2026-09-08.md)，它新增两个 rc.2 开发依赖并更新相应 lockfile / notices。上述“保持”记录指版本评估阶段；没有采用本报告的新版候选。

继续保留自定义原生 SessionEvent 和恢复语义，需要上游提供可由 live Session 正式写入兼容性 marker 的公开能力，并验证事件对核心恢复确实可忽略且原始记录仍保留。旧试验日志保留为 RED 证据；如需继续这些旧会话，还需要官方支持的迁移路径，未来 writer 不会自动修复它们。任何本仓库补丁、手改日志、修改静态目录或改变事件协议都不属于本次官方版本采用授权。
