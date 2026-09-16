/**
 * 推演: the two proposal-only experiments, and the honest state of the runner.
 *
 * The prototype draws this screen as 沙盒侧车未连接 with disabled forms. In this
 * product the experiments are real registered Agent tools
 * (`simulate_novel_reader_response`, `simulate_novel_story_world`) that run
 * inside a thread against a frozen accepted revision and never advance Canon —
 * so the canvas states that, lists each tool's own parameters, shows the
 * revision Canon would freeze, and hands the author to a thread. The external
 * sandbox sidecar is still not connected, and the screen says so instead of
 * pretending otherwise.
 */
import { createElement, type ReactNode } from 'react'

/** Everything the canvas receives: the frozen revision and the thread hand-off. */
export interface SimulationViewProps {
  /** Accepted revision an experiment would freeze; absent before any R exists. */
  readonly revision: number | undefined
  /** Hand the author to a thread, where the experiment tool actually runs. */
  readonly onOpenThread: () => void
}

/** The two experiments, with the parameters their tools actually accept. */
const EXPERIMENTS: readonly {
  readonly id: string
  readonly name: string
  readonly tool: string
  readonly kind: string
  readonly description: string
  readonly parameters: readonly string[]
}[] = [
  {
    id: 'reader-response',
    name: '读者反应',
    tool: 'simulate_novel_reader_response',
    kind: '读者反应',
    description: '把已接受正文（或未接受的候选稿）给一个或多个读者 Persona 读，问一个明确的问题，得到反应与分歧；读者看不到隐藏设定。',
    parameters: ['revision', 'unitId', 'hypothesis', 'persona', 'personas', 'readingHistory', 'candidate', 'candidates', 'variants', 'feedback', 'seed', 'seeds'],
  },
  {
    id: 'story-world',
    name: '人物压力',
    tool: 'simulate_novel_story_world',
    kind: '人物压力',
    description: '把一个人物（或一组人物）放进反事实处境，按顺序动作推进，观察代价、误读与未解决钩子；可比较多角色、多种子与显式分支。',
    parameters: ['mode', 'revision', 'maxActions', 'storyTime', 'hypothesis', 'assumptions', 'actor', 'actors', 'seed', 'seeds', 'branches'],
  },
]

/** The simulation canvas. */
export function SimulationView(props: SimulationViewProps): ReactNode {
  return createElement(
    'section',
    { 'data-novel-simulation': 'true' },
    createElement(
      'div',
      {
        className: 'card plain',
        style: { borderColor: 'hsl(var(--warn) / .4)', marginBottom: '18px' },
      },
      createElement(
        'div',
        { className: 'card-h' },
        createElement('span', { className: 'chip warn' }, '沙盒侧车未接入'),
        createElement('span', { className: 'r chip' }, '外部沙盒推演暂不可用'),
      ),
      createElement(
        'div',
        { style: { fontSize: '13px', lineHeight: 1.7 } },
        '读者反应与人物压力这两类推演已经可以用：它们由 Agent 工具在会话里执行，基于',
        createElement('b', null, '指定的固定版本'),
        '运行，结果只作创作参考，不会直接写入故事事实——要写进故事，仍然必须经过提案审阅。外部沙盒侧车（MiroFish）尚未接入，所以这里不做独立的运行面板。',
      ),
      createElement(
        'div',
        { className: 'row', style: { gap: '8px', marginTop: '14px', display: 'flex', alignItems: 'center' } },
        createElement(
          'button',
          {
            type: 'button',
            className: 'btn primary',
            'data-novel-simulation-open-thread': 'true',
            onClick: () => { props.onOpenThread() },
          },
          '去线程里发起推演',
        ),
        createElement(
          'span',
          { className: 'chip num' },
          props.revision === undefined ? '还没有已接受版本' : `固定版本 R${String(props.revision)}`,
        ),
      ),
    ),
    createElement(
      'div',
      { className: 'grid g2', style: { marginBottom: '18px' } },
      EXPERIMENTS.map(experiment => createElement(
        'div',
        { className: 'card', key: experiment.id, 'data-novel-experiment': experiment.id },
        createElement(
          'div',
          { className: 'card-h' },
          createElement('span', { className: 't' }, experiment.name),
          createElement('span', { className: 'r' }, createElement('span', { className: 'chip' }, experiment.kind)),
        ),
        createElement('div', { className: 'note', style: { lineHeight: 1.7 } }, experiment.description),
        createElement(
          'div',
          { className: 'note', style: { marginTop: '10px' } },
          `工具：${experiment.tool}`,
        ),
        createElement(
          'div',
          { className: 'row', style: { gap: '4px', marginTop: '8px', display: 'flex', flexWrap: 'wrap' } },
          experiment.parameters.map(parameter => createElement(
            'span',
            { className: 'tag', key: parameter },
            parameter,
          )),
        ),
        createElement(
          'div',
          { className: 'row', style: { gap: '8px', marginTop: '12px', display: 'flex' } },
          createElement(
            'button',
            {
              type: 'button',
              className: 'btn sm',
              onClick: () => { props.onOpenThread() },
            },
            '去线程里发起',
          ),
        ),
      )),
    ),
    createElement(
      'p',
      { className: 'note' },
      '推演结果永远只是提案：真正写进故事，仍然要走「提案审阅 → 接受」这条唯一路径。',
    ),
  )
}
