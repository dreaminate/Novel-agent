# S2 查证结论：composer 的中文，以及为什么它不是产品缺陷

**日期：** 2026-09-18 · **增量：** A6 · **结论：停止条件 #1 不成立，不做 locale 注入。**

## 问题（工作单 S2）

> 中文写作工具的输入框是英文的：官方 composer placeholder「Describe what you want to build...」、模型名「Deep... High」中英混杂。**先查证 profile 安装的 `@deepseek-ai/dsh-client-locale` 词表是否覆盖 conversation 包**。

## 一、词表覆盖：覆盖，而且是完整覆盖

profile 实际安装的那批包在 `profiles/novel/node_modules/`，不在仓库根（I1.1 的教训）：

- `@deepseek-ai/dsh-client-ui-conversation/lib/client.js` 里 `NS = "conversation"`，并且**自己**调用了 `locale.register(NS, {...})`。
- placeholder 不是硬编码字符串，是词条：
  ```js
  const zh = { …, "placeholder.hero": "描述你想要构建的内容… / 调用指令 @ 文件或对话", … }
  /** English dictionary, checked complete against the zh key set. */
  const en = { …, "placeholder.hero": "Describe what you want to build... / commands, @ files or sessions", … }
  ```
  源码注释写明英汉两本词典**键集必须一致**，注册时校验。
- 也就是说：**中文文案早就在包里**。屏幕上出现英文，只可能是当前 locale 解析成了 `en`。

## 二、locale 什么时候解析成 `en`

`LocaleRuntime` 的文档写得很直白：英文「既是浏览器没有报出任何已注册语言时的开局语言，也是活动语言查不到键时的回落词典」。

**走查探针的 headless Chrome 不带 `Accept-Language`**，所以它就落进了这个「没有报语言」的分支。

## 三、实测（`probe-locale.mjs` 可复跑）

同一个 host，两次打开：一次不带语言（走查探针的做法），一次带 `zh-CN,zh;q=0.9,en;q=0.8`。

```
withoutLanguage: askedFor "(nothing — what the walkthrough sends)"
                 languages ["zh-CN","zh"]        placeholder 描述你想要构建的内容… / 调用指令 @ 文件或对话
asTheAuthor:     askedFor "zh-CN,zh;q=0.9,en;q=0.8"
                 languages ["zh-CN","zh;q=0.9","en;q=0.8"]  placeholder 描述你想要构建的内容… / 调用指令 @ 文件或对话
```

**两种情况下 composer 都是中文**——这台机器的系统语言就是 zh-CN，Chrome 会把它带进 `navigator.languages`。

## 三点五、而且 S2 的前提在既有证据里复现不出来

把整个 `docs/evidence/` 搜一遍：

- `Describe what you want to build` —— **只出现在本文件与本次新增的探针里**。
- `描述你想要构建的内容` —— 出现在 `interaction-2026-09-18/sweep-summary.json` 与 2026-09-17 的审批证据里，也就是**更早的真机记录里它一直是中文**。

所以「官方 composer placeholder 是英文的」这条，从记录上看**从来没有发生过**。那一行上确实有英文，但那是**模型自己的名字**（`Deep… High`）——provider 数据，不是 locale 词条；旁边的档位标签是本地化的（截图里是「标准模式」）。

## 四、因此

1. **不注入 locale。** `ctx.locale.setLocale()` 是**用户偏好写入**（durable，会覆盖作者的选择），而且 `register(ns, locale, dict)` 对同一 `(conversation, zh)` 是**单占位、重复即抛**——官方包已经占了。用官方 seam 去强行改语言，等于替作者做他没做的决定，方向也错了。
2. **要改的是探针。** 走查探针必须带 `Accept-Language: zh-CN`，否则它测的是一个作者不会有的浏览器；A6 的「作者面不得出现英文」断言如果建立在它上面，就是无效证据。
3. **顺带记录**：模型名「Deep… High」同为官方 locale 词条，随同一开关一起正确，不需要单独处理。

## 五、仍然要做的（A6 其余部分）

S2 之外，A6 还有两处**我们自己的**文案问题，那才是真缺陷：提交确认卡一句话塞五个工程术语（S1）、编辑器副标题写着 `workdir` 与 `Canon`。见工作单 A6 小节的完成记录。
