# 写作工作台交互原型 — 2026-09-15

OpenDesign（`nexu-io/open-design`，本地桌面 app）按
[前端重设计 brief](../../frontend-redesign-brief-2026-09-15.md) 生成的可点击原型。

| 文件 | 说明 |
| --- | --- |
| `index.html` | 单文件可点击原型（212 KB，内嵌 CSS/JS，无外部资源），模拟宿主窗口并在屏幕间切换 |
| `design-tokens.md` | 设计 token 表与组件清单（13 KB）：日/夜两套语义色、字阶、势力色、宿主外壳中性灰 |

**来源：** OpenDesign 项目 `ca16c8f8-48a1-40d1-8abd-5dd38bf3f948`（数据目录
`%APPDATA%\Open Design\namespaces\release-stable-win\data\projects\`），当前为作者迭代后的
第 3 版（`.file-versions/0003-…`，2026-09-15 22:55）。

- `index.html` SHA256：`5b8682c43f1476c1133ebf83db5ea1a5201b363dd732752ba6ec09b26ddea2b4`
- `design-tokens.md` SHA256：`56f6b886eeea911c80030f6b0195571d8441e4d2c9bfc5e0b92dfdedca7f8bd5`

## 已做的自动检查（2026-09-15，第 3 版复检）

- 无任何网络引用（无外部字体/CDN/图片，`http(s)://` 零命中）。
- 简体中文界面；未发现 lorem / TODO / 占位文案（`placeholder` 只是输入框属性）。
- 关键界面文案均存在：故事地图、人物档案（当前状态/情绪/人物弧线/出场章节）、
  提案审阅（将写入的设定变更/审阅问题/预览影响/接受本章）、伏笔与线索板、
  时间线、写作记忆、连续性检查、沙盒推演（含「沙盒侧车未连接」态）、
  开发者诊断、版本历史（回滚到此版本）、夜间/白天切换、窄窗 1280、
  「未安装小说规划插件」缺插件态、「故事还没有开始」空项目态。
- 结构：单 `<style>` + 单 `<script>`、17 个内联 SVG、83 个按钮、95 个中文界面标签。

## 未验证（需要人眼）

- 观感、排版细节、动效与交互手感；40+ 人物时的分簇/搜索/过滤是否真正可读；
  三条关键链路是否真的 ≤3 击；对比度与键盘可达性的实测。
- 建议直接用浏览器打开 `index.html` 逐条对照
  [验收清单](../../frontend-redesign-brief-2026-09-15.md) 附录 C；不通过就按条目发回
  OpenDesign 返修，然后再替换本目录文件并更新 SHA256。

## 边界

这是设计产物，不是产品代码；它不接入 DSH、不改 `packages/`。落地实现前仍需先按
重设计 brief 的说明修订 `AGENTS.md` 的前端 seam 边界（`conversation.view` +
回合尾卡 / 工具详情 / 输入区 dock / 会话头部工具）。
