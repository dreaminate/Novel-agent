import { Context, Service } from '@deepseek-ai/cordis'
import type { SkillRegistration } from '@deepseek-ai/dsh-skill'
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace'
import type {} from '@novel-agent/novel-project'
import type { NovelNarrativeProjection, NovelResultPacketDraft } from '@novel-agent/novel-project/types'
import { novelPlanningProjector } from './projection.js'
import { novelDomainDeltaKinds } from './schema.js'
import type {} from '@deepseek-ai/dsh-system-prompt'

const NOVEL_PLANNING_GUIDANCE = `# Novel planning

- Project setup: after the author supplies or revises the creative brief, call \`propose_novel_result_packet\` with a Canon-only packet that omits \`manuscript\` and \`manuscriptDiff\` and proposes \`creative-profile\` / \`reader-contract\` Deltas. The author still decides every Delta and applies the packet before it becomes accepted project state.

- Plan: proposal only. State the source revision, narrative scope, alternatives, constraints and stop condition. Pass the author's current planning intent as \`writingMemoryQuery\` to \`retrieve_novel_context\`; when planning one accepted Chapter, include its Chapter id as \`chapterId\` in that same call so the read-only Tool also reconstructs its control pack. Use the returned intent-ranked rolling roadmaps for cross-Chapter horizon, milestones, Chapter ranges, dependencies and scoped debts. For a not-yet-accepted next Chapter, omit \`chapterId\` and also use the returned query-independent character carry-forward, query-independent character arc hypotheses, query-independent latest reader disclosure carry-forward from the latest accepted post-Chapter check (\`readerNowKnows\` and \`readerNowSuspects\`), query-independent latest Chapter outcome carry-forward from that post-check (\`contractAssessment\`, \`changes\`, \`costs\`, \`newlyPossible\` and \`newlyImpossible\`), query-independent relationship carry-forward, query-independent knowledge boundaries and intent-ranked accepted narrative units. Treat the returned style, serialization and reader profiles as mandatory authoring contracts even when they do not match the query terms. Do not mutate manuscript or Canon.`

const NOVEL_ARCHITECT_CHAPTER_PACKET_EXAMPLE = {
  packetId: 'architect-chapter-example',
  expectedRevision: 0,
  deltas: [{
    id: 'architect-chapter-unit-example',
    kind: 'narrative-unit',
    operation: 'set',
    targetId: 'chapter-example',
    field: 'unit',
    value: {
      level: 'chapter',
      parentId: 'arc-example',
      order: 0,
      objective: '本章要达成的剧情目标',
      entryState: '开章时已接受的状态',
      exitState: '本章计划造成的状态变化',
      status: 'planned',
      chapterContract: {
        viewpoint: '本章视角人物与人称',
        storyTime: '本章发生的故事时间',
        sceneFunctions: ['阻碍、关键出场者、爽点与章尾钩子的场景功能'],
        activePlotLineIds: [],
        activeRelationshipLineIds: [],
        promisesTouched: [{
          promiseId: 'promise-example',
          intendedMovement: '本章计划推进的承诺阶段',
        }],
        informationPolicy: {
          readerMayKnow: [],
          characterMayKnow: [{
            characterId: 'character-example',
            facts: ['本章该角色允许知道的已接受事实'],
          }],
        },
        progressionSetups: [],
        progressionPayoffs: [],
        emotionalMovement: '本章计划完成的情绪位移',
        endingPull: '推动读者进入下一章的具体拉力',
        prohibitedContradictions: [],
        styleConstraints: ['本章必须遵守的已接受文风约束'],
        lengthRange: { min: 2900, max: 3100 },
        acceptanceGates: ['可观察、可逐项审阅的验收条件'],
      },
    },
    sourceAnchorIds: ['architect-source-anchor-example'],
  }],
  issues: [],
  sourceAnchors: [{
    id: 'architect-source-anchor-example',
    sourceId: 'author-intent-example',
    start: 0,
    end: 1,
    contentHash: 'a'.repeat(64),
  }],
  provenance: {
    taskId: 'architect-task-example',
    sessionId: 'architect-session-example',
    producer: 'novel-architect',
  },
} satisfies NovelResultPacketDraft

const NOVEL_ARCHITECT_POST_CHECK_PACKET_EXAMPLE = {
  packetId: 'architect-post-check-example',
  expectedRevision: 2,
  deltas: [{
    id: 'architect-post-check-delta-example',
    kind: 'chapter-state',
    operation: 'set',
    targetId: 'chapter-example',
    field: 'post-check',
    value: {
      contractAssessment: {
        contractRevision: 1,
        contractSourceDeltaId: 'architect-chapter-unit-example',
        outcome: 'met',
        deviations: [],
      },
      manuscriptSourceRevision: 2,
      changes: ['本章实际造成的状态变化'],
      costs: ['本章实际付出的代价'],
      newlyPossible: ['本章之后成为可能的行动'],
      newlyImpossible: [],
      readerNowKnows: ['读者已明确获知的信息'],
      readerNowSuspects: [],
      characterCarryForward: [{
        characterId: 'character-example',
        carries: ['下一章必须延续的角色状态'],
      }],
      debtTransitions: [{
        clock: 'promise',
        debtId: 'promise-debt-example',
        transition: 'advanced',
        sourceDeltaId: 'promise-debt-source-delta-example',
      }],
    },
    sourceAnchorIds: ['architect-post-check-source-anchor-example'],
  }],
  issues: [],
  sourceAnchors: [{
    id: 'architect-post-check-source-anchor-example',
    sourceId: 'accepted-manuscript-example',
    start: 0,
    end: 1,
    contentHash: 'b'.repeat(64),
  }],
  provenance: {
    taskId: 'architect-post-check-task-example',
    sessionId: 'architect-post-check-session-example',
    producer: 'novel-architect',
  },
} satisfies NovelResultPacketDraft

const NOVEL_ARCHITECT_SKILL = {
  name: 'novel-architect',
  description: '小说架构师：基于当前 accepted revision 规划或修订整书、卷、剧情阶段、章节与场景结构，并把结果交给现有 Result Packet 审阅流程。',
  whenToUse: '用户需要小说整体架构、分卷路线、剧情阶段、章节合同、伏笔回收或结局方向时使用。',
  source: '@novel-agent/novel-planning',
  invocation: {
    modelInvocable: true,
    userInvocable: true,
  },
  content: `# 小说架构师

你负责把作者意图整理成可执行、可审阅、可跨 revision 延续的小说结构，不负责直接写入项目事实。

1. 先调用 \`retrieve_novel_context\` 读取 current accepted revision 的 Novel Project Canon、相关正文证据、写作记忆、路线图与未清偿剧情债务。不得用某个 Session 的临时内容替代 Project 事实。
2. 按 \`series\` / \`book\` / \`volume\` / \`arc\` / \`chapter\` / \`scene\` / \`beat\` / \`prose\` 的实际需要分层；只规划当前任务要求的层级。保持主线、支线、人物弧、双向关系、世界规则、力量限制、伏笔、承诺、秘密、时间线和结局方向互相可引用。
3. 把 Chapter 规划映射到已有严格字段，不得虚构 Chapter contract 字段。\`narrative-unit.value\` 必须完整给出 \`level\`、\`parentId\`、\`order\`、\`objective\`、\`entryState\`、\`exitState\`、\`status\` 和 \`chapterContract\`。\`chapterContract\` 必须完整给出 \`viewpoint\`、\`storyTime\`、\`sceneFunctions\`、\`activePlotLineIds\`、\`activeRelationshipLineIds\`、\`promisesTouched\`、\`informationPolicy\`、\`progressionSetups\`、\`progressionPayoffs\`、\`emotionalMovement\`、\`endingPull\`、\`prohibitedContradictions\`、\`styleConstraints\`、\`lengthRange\` 和 \`acceptanceGates\`；每个 \`promisesTouched\` 条目必须给出 \`promiseId\` 和 \`intendedMovement\`，每个 \`informationPolicy.characterMayKnow\` 条目必须给出 \`characterId\` 和 \`facts\`。当前没有条目的数组也要显式写成 \`[]\`。\`narrative-unit\` 的 \`unit.objective\` 保存目标，计划的起始/结束状态写入 \`unit.entryState\` / \`unit.exitState\`；阻碍、关键出场者、爽点和章尾钩子写成 \`sceneFunctions\` 与 \`acceptanceGates\` 中可验收的条目，预期结果/代价写入 \`unit.exitState\` 和验收点。每章必须造成可追踪的状态变化。

下面是能通过当前严格 Result Packet parser 的 Chapter 规划骨架。所有示例 id、revision、Anchor、内容和引用都必须替换为当前 accepted Project 中真实可用的值；不要照抄占位内容：

<novel_architect_chapter_packet_example>
\`\`\`json
${JSON.stringify(NOVEL_ARCHITECT_CHAPTER_PACKET_EXAMPLE, null, 2)}
\`\`\`
</novel_architect_chapter_packet_example>

4. \`chapter-state/post-check\` 只能在正文已经被接受后记录实际结果。Delta wrapper 必须使用 \`kind: "chapter-state"\`、\`operation: "set"\`、\`field: "post-check"\`、Chapter \`targetId\`、稳定 \`id\` 和 \`sourceAnchorIds\`；\`value\` 必须一次完整给出 \`contractAssessment\`（含 \`contractRevision\`、\`contractSourceDeltaId\`、\`outcome\`、\`deviations\`）、\`manuscriptSourceRevision\`、\`changes\`、\`costs\`、\`newlyPossible\`、\`newlyImpossible\`、\`readerNowKnows\`、\`readerNowSuspects\`、\`characterCarryForward\` 和 \`debtTransitions\`。\`outcome\` 只能是 \`met\` / \`changed\` / \`missed\`。每个 \`characterCarryForward\` 条目都要完整给出 \`characterId\` 与 \`carries\`。每个 \`debtTransitions\` 条目都要完整给出 \`clock\`、\`debtId\`、\`transition\` 与 \`sourceDeltaId\`；\`transition\` 只能是 \`created\` / \`advanced\` / \`paid\` / \`retired\`，\`clock\` 只能是 \`plot\` / \`promise\` / \`progression\` / \`world\` / \`character\` / \`relationship\` / \`mystery\` / \`reader-knowledge\` / \`tension-payoff\` / \`ending\`。当前没有内容的数组也要显式写成 \`[]\`；合同、正文和债务引用必须指向同一 accepted lineage 中真实存在的来源。

下面是能通过当前严格 Result Packet parser 的 post-Chapter check 骨架。它只能用于已接受正文之后；所有示例 id、revision、Anchor、内容和引用都必须替换为同一 accepted lineage 中真实存在的值：

<novel_architect_post_check_packet_example>
\`\`\`json
${JSON.stringify(NOVEL_ARCHITECT_POST_CHECK_PACKET_EXAMPLE, null, 2)}
\`\`\`
</novel_architect_post_check_packet_example>

5. 先列结构骨架，再补必要细节。给每条新事实、叙事单元、时钟或剧情债务稳定 id，并保留来自 accepted manuscript 的 SourceAnchor 证据；引用不存在或字段不完整时停止入库提案并指出缺口。
6. 输出必须进入现有 authorization-free Result Packet：用严格 Canon/narrative Deltas 表达设定与结构变化，写清 expected revision、来源 Anchor、provenance 和必要 manuscript Diff。不得直接写入 Canon，不得添加 author authorization。
7. 作者逐项接受或拒绝后，只有现有 Novel Project Apply 事务可以产生下一 revision。需要其他角色时，用 DSH 原生 Subagent/消息机制临时委派，不创建常驻专家团、第二套 Agent Loop、Session 或状态库。`,
} satisfies SkillRegistration

const NOVEL_HOOK_PAYOFF_PACKET_EXAMPLE = {
  packetId: 'hook-payoff-example',
  expectedRevision: 0,
  deltas: [{
    id: 'hook-payoff-clock-example',
    kind: 'narrative-clock',
    operation: 'set',
    targetId: 'chapter-example',
    field: 'tension-payoff',
    value: {
      movement: '本章由威胁升级到局部释放，并保留下一章的追问',
      state: '主角以可见代价得到阶段性成果，未结债务继续推动读者进入下一章',
      storyTime: '本章故事时间',
      version: 1,
      scope: {
        unitId: 'chapter-example',
        level: 'chapter',
      },
      waves: [{
        waveId: 'chapter-example-pressure-wave',
        source: '已接受的目标、阻碍和承诺使主角必须立刻行动',
        intensity: {
          opening: 'low',
          peak: 'high',
          closing: 'medium',
        },
        duration: {
          startUnitId: 'scene-opening-example',
          endUnitId: 'scene-climax-example',
        },
        release: {
          markerUnitId: 'scene-climax-example',
          status: 'planned',
          kind: 'partial',
          description: '主角赢得局部突破，但尚未解除核心阻碍',
          cost: '为突破付出可追踪的资源或关系代价',
          aftermath: '局部胜利改变下一章的选择并留下新的压力',
        },
        recovery: null,
        sceneFunctions: [{
          sceneUnitId: 'scene-climax-example',
          function: 'escalation',
          contribution: '把当前阻碍推进到必须用代价换取局部释放的程度',
        }],
      }],
      revisionRationale: '把已接受读者契约中的当前承诺落实为可审阅的章节张力计划',
    },
    sourceAnchorIds: ['hook-payoff-source-anchor-example'],
  }],
  issues: [],
  sourceAnchors: [{
    id: 'hook-payoff-source-anchor-example',
    sourceId: 'reader-contract-example',
    start: 0,
    end: 1,
    contentHash: 'c'.repeat(64),
  }],
  provenance: {
    taskId: 'hook-payoff-task-example',
    sessionId: 'hook-payoff-session-example',
    producer: 'novel-hook-payoff-planner',
  },
} satisfies NovelResultPacketDraft

const NOVEL_HOOK_PAYOFF_PLANNER_SKILL = {
  name: 'novel-hook-payoff-planner',
  description: '爽点与钩子策划：基于已接受的读者契约和章节状态，提出可审阅的张力、局部释放与下一章拉力。',
  whenToUse: '用户需要规划爽点、章尾钩子、张力升级、局部释放或兑现节奏时使用。',
  source: '@novel-agent/novel-planning',
  invocation: {
    modelInvocable: true,
    userInvocable: true,
  },
  content: `# 爽点与钩子策划

你负责把作者想要的爽点、钩子和兑现节奏变成可审阅的提案，不负责直接写入项目事实。

1. 先调用 \`retrieve_novel_context\`，读取 current accepted revision 的 Novel Project Canon、相关正文证据、未清偿剧情债务、路线图、章节结构和写作记忆。只用该 revision 的事实；不得把某个 Session 的临时内容当作 Project 状态。
2. 以已接受的 \`reader-contract\`、创作 profile、世界规则、人物限制、承诺、线索和当前 Chapter 目标为边界。只策划当前请求的 scope：明确读者此刻期待什么、阻碍怎样升级、主角取得什么局部成果、为此付出什么代价，以及哪一项未解问题构成下一章拉力。没有证据时指出缺口，不编造读者契约、奖励、能力、债务或结局。
3. 不创建自定义 \`hook\`、\`payoff\` 或“爽点”字段。章节内的期待、升级、高潮、局部释放、余波与转场使用已有 \`sceneFunctions\`、\`acceptanceGates\`、\`unit.objective\`、\`unit.exitState\` 和已有线索、承诺、剧情债务 Delta 表达。任何奖励、反转或胜利都必须有可追踪代价、状态变化和来源；不要把未接受计划叙述成已发生事实。
4. 章节/场景/Arc/卷的节奏使用严格 \`narrative-clock/tension-payoff\` Delta：wrapper 必须是 \`kind: "narrative-clock"\`、\`operation: "set"\`、\`field: "tension-payoff"\`，并且 \`targetId\` 必须等于 \`value.scope.unitId\`。\`value\` 必须完整给出 \`movement\`、\`state\`、正整数 \`version\`、\`scope\`、至少一个 \`waves\` 和 \`revisionRationale\`；\`scope.level\` 只能是 \`scene\` / \`chapter\` / \`arc\` / \`volume\`。每个 wave 必须给出 \`waveId\`、\`source\`、三段 \`intensity\`、\`duration\`、\`release\`、\`recovery\` 和 \`sceneFunctions\`。强度只能是 \`rest\` / \`low\` / \`medium\` / \`high\` / \`peak\`；\`release\` 可为 \`null\`，否则必须含有 marker、planned/occurred 状态、partial/full/reversal 类型、description、cost 和 aftermath；\`recovery\` 可为 \`null\`，否则必须给出 marker、planned/occurred 状态、description 和 stateAfter。\`sceneFunctions\` 中每项必须给出 \`sceneUnitId\`、\`function\` 和 \`contribution\`；\`function\` 只能是 \`anticipation\` / \`pressure\` / \`escalation\` / \`climax\` / \`release\` / \`aftermath\` / \`reflection\` / \`recovery\` / \`renewal\` / \`transition\`。

下面是能通过当前严格 Result Packet parser 的 hook/payoff 规划骨架。所有示例 id、revision、Anchor、内容和引用都必须替换为当前 accepted Project 中真实可用的值；不要照抄占位内容：

<novel_hook_payoff_packet_example>
\`\`\`json
${JSON.stringify(NOVEL_HOOK_PAYOFF_PACKET_EXAMPLE, null, 2)}
\`\`\`
</novel_hook_payoff_packet_example>

5. 输出只能是现有 authorization-free Result Packet：写清 expected revision、SourceAnchor、provenance 和必要 Delta。不得直接写入 Canon，不得添加 author authorization，也不得把计划自动接受或发布。作者逐项决定后，只有现有 Novel Project Apply 事务可以产生下一 revision。`,
} satisfies SkillRegistration

const NOVEL_WORLD_CHARACTER_PACKET_EXAMPLE = {
  packetId: 'world-character-setting-example',
  expectedRevision: 0,
  deltas: [{
    id: 'world-rule-example',
    kind: 'world',
    operation: 'set',
    targetId: 'world-rule-access-example',
    field: 'rule',
    value: {
      scope: '城门与夜间通行',
      statement: '持有城门印的人才能在宵禁后通过北门',
      version: 1,
      exceptions: ['救援队可由两名守卫共同签字放行'],
      publicBelief: '北门在宵禁后完全封闭',
      hiddenTruth: '城门印会在特定月相短暂失效',
      observedConsequences: ['主角必须在宵禁前决定是否交出城门印'],
    },
    sourceAnchorIds: ['world-character-source-anchor-example'],
  }, {
    id: 'character-goal-example',
    kind: 'character-state',
    operation: 'set',
    targetId: 'character-example',
    field: 'goal',
    value: '在宵禁前带着证人安全通过北门',
    sourceAnchorIds: ['world-character-source-anchor-example'],
  }, {
    id: 'character-arc-hypothesis-example',
    kind: 'character-state',
    operation: 'set',
    targetId: 'character-example',
    field: 'arc-hypothesis',
    value: {
      version: 1,
      scopeUnitId: 'book-example',
      hypothesis: '主角会从独自控制局面转向与同伴共享风险',
      startingBelief: '只有独自控制局面才能保护同伴',
      targetTransformation: '主动共享风险，并接受同伴对路线的异议',
      transformationDimensions: ['belief', 'relationship'],
      pressures: ['城门危机迫使主角在独行与信任同伴之间选择'],
      decisionChain: [{
        decisionId: 'character-arc-decision-example',
        storyEventId: 'story-event-north-gate-example',
        pressure: '证人与同伴不能同时由主角独自护送',
        choice: '把城门印交给同伴并共同制定路线',
        rejectedAlternatives: ['隐瞒风险并独自带证人行动'],
        cost: '失去对局面的完全控制',
        persistentConsequence: '同伴获得未来路线决策权',
        transformationEvidence: '主角在仍可撤回时维持共同决定',
      }],
      currentStage: '仍倾向独自控制，但首次交出部分决定权',
      unresolvedQuestion: '下次更大风险来临时是否继续共享决定',
      changeRationale: '把作者要求的人物弧转成可验证的选择链',
    },
    sourceAnchorIds: ['world-character-source-anchor-example'],
  }],
  issues: [],
  sourceAnchors: [{
    id: 'world-character-source-anchor-example',
    sourceId: 'author-setting-intent-example',
    start: 0,
    end: 1,
    contentHash: 'd'.repeat(64),
  }],
  provenance: {
    taskId: 'world-character-setting-task-example',
    sessionId: 'world-character-setting-session-example',
    producer: 'novel-world-character-setting',
  },
} satisfies NovelResultPacketDraft

const NOVEL_WORLD_CHARACTER_SETTING_SKILL = {
  name: 'novel-world-character-setting',
  description: '世界观与人物设定：基于已接受的项目事实，提出可审阅的世界规则与人物设定变更。',
  whenToUse: '用户需要创建或修订世界规则、人物目标、信念、缺陷、声音、资源、地点或人物弧假设时使用。',
  source: '@novel-agent/novel-planning',
  invocation: {
    modelInvocable: true,
    userInvocable: true,
  },
  content: `# 世界观与人物设定

你负责把作者意图整理成可审阅、可跨 revision 延续的世界观与人物设定提案，不负责直接写入项目事实。

1. 先调用 \`retrieve_novel_context\`，读取 current accepted revision 的 Novel Project Canon、相关正文证据、人物/关系/知识状态、世界规则、路线图和写作记忆。只使用该 revision 的事实；不得把 Session 临时内容、未接受草稿或推测当作 Canon。
2. 每项世界设定都要说明适用范围、规则本身、例外、公众所知、隐藏真相和可观察后果。人物设定要把稳定 id、目标、信念、价值、缺陷、声音、位置、资源、秘密和已知信息分别落在可追踪的现有 Canon 字段；人物关系只使用既有双向 relationship 事实，不能以单方描述替代另一条关系状态。
3. \`world/rule\` 是严格 contract：Delta wrapper 必须使用 \`kind: "world"\`、\`operation: "set"\`、\`field: "rule"\`、稳定 \`id\`、规则 \`targetId\` 和 \`sourceAnchorIds\`。\`value\` 必须完整给出 \`scope\`、\`statement\`、正整数 \`version\`、\`exceptions\`、\`publicBelief\`、\`hiddenTruth\` 和 \`observedConsequences\`；没有例外或后果时也显式写 \`[]\`。
4. 人物状态使用已有 \`character-state\` Delta 和稳定角色 \`targetId\`；每个字段独立表达一个可审阅事实，例如 \`goal\`、\`belief\`、\`flaw\`、\`voice\`、\`location\` 或 \`resources\`。不要创造第二套 Character store 或自定义 Result Packet 字段。\`character-state/arc-hypothesis\` 的 Delta wrapper 必须使用 \`kind: "character-state"\`、\`operation: "set"\`、\`field: "arc-hypothesis"\`、角色 \`targetId\`、稳定 \`id\` 与 \`sourceAnchorIds\`；\`value\` 必须完整给出正整数 \`version\`、\`scopeUnitId\`、\`hypothesis\`、\`startingBelief\`、\`targetTransformation\`、非空 \`transformationDimensions\`、非空 \`pressures\`、\`decisionChain\`、\`currentStage\`、\`unresolvedQuestion\` 和可为 \`null\` 的 \`changeRationale\`。\`transformationDimensions\` 只能使用 \`belief\` / \`strategy\` / \`identity\` / \`relationship\` / \`responsibility\`。每个 \`decisionChain\` 条目都必须完整给出 \`decisionId\`、\`storyEventId\`、\`pressure\`、\`choice\`、\`rejectedAlternatives\`、\`cost\`、\`persistentConsequence\` 与 \`transformationEvidence\`。无法完整满足 contract 时，把作者尚未确定的弧线写成 proposal 中的待定问题，而非已接受事实。

下面是能通过当前严格 Result Packet parser 的世界规则、人物目标与人物弧假设骨架。所有示例 id、revision、Anchor、内容和引用都必须替换为当前 accepted Project 中真实可用的值；不要照抄占位内容：

<novel_world_character_packet_example>
\`\`\`json
${JSON.stringify(NOVEL_WORLD_CHARACTER_PACKET_EXAMPLE, null, 2)}
\`\`\`
</novel_world_character_packet_example>

5. 输出只能是现有 authorization-free Result Packet：写清 expected revision、SourceAnchor、provenance 和必要 Delta。不得直接写入 Canon，不得添加 author authorization，也不得自动接受、改写正文或发布。作者逐项决定后，只有现有 Novel Project Apply 事务可以产生下一 revision。`,
} satisfies SkillRegistration

declare module '@deepseek-ai/cordis' {
  interface Context {
    novelPlanning: NovelPlanningService
  }
}

/** Planning roles and accepted plan reads share the native plugin lifetime. */
export class NovelPlanningService extends Service {
  static inject = ['novelProject']

  constructor(ctx: Context) {
    super(ctx, 'novelPlanning')
    ctx.inject(['systemPrompt'], promptCtx => promptCtx.systemPrompt.section({
      name: 'novel:planning',
      order: 122,
      text: NOVEL_PLANNING_GUIDANCE,
    }))
    ctx.effect(() => ctx.novelProject.registerProjector('planning/narrative', novelPlanningProjector))
    ctx.effect(() => {
      const disposers = novelDomainDeltaKinds.map(deltaKind => ctx.novelProject.registerDeltaKind(deltaKind))
      return () => { for (const dispose of disposers) dispose() }
    })
    ctx.inject(['skills'], skillCtx => {
      skillCtx.skills.register(NOVEL_ARCHITECT_SKILL)
      skillCtx.skills.register(NOVEL_HOOK_PAYOFF_PLANNER_SKILL)
      skillCtx.skills.register(NOVEL_WORLD_CHARACTER_SETTING_SKILL)
    })
  }

  /** Read the accepted hierarchy and chapter contracts at exactly this revision. */
  readPlan(workspaceId: WorkspaceId, revision: number): NovelNarrativeProjection {
    return this.ctx.novelProject.readProjection<NovelNarrativeProjection>('planning/narrative', workspaceId, revision)
  }
}

export default NovelPlanningService
