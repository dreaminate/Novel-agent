/** Browser Cordis half of the Novel Project plugin. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import novelProjectRemote from '@novel-agent/novel-project/remote'
import { NovelProjectPanel, type NovelProjectPanelActions } from './NovelProjectPanel.js'

/** DSH owns the Remote registry; the nested consumer Fiber waits on the mounted namespace. */
export const inject = ['remote']

export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(novelProjectRemote)
  const uiFiber = ctx.plugin({
    name: '@novel-agent/novel-project/client-ui',
    inject: ['slots', 'remote.novelProject'],
    apply(uiCtx: Context) {
      return uiCtx.slots.inject('conversation.view', () => uiCtx.slots.register({
        name: 'conversation.view',
        id: 'novel-project',
        order: 10,
        label: '小说工作台',
        inject: (sessionId): NovelProjectPanelActions => ({
          openProject: async workspaceId =>
            await uiCtx.remote.novelProject.open(workspaceId),
          generateReviewDraft: async (workspaceId, request, signal) =>
            await uiCtx.remote.novelProject.reviewDraft(
              sessionId,
              workspaceId,
              request,
              signal,
            ),
          previewReview: async (workspaceId, review) =>
            await uiCtx.remote.novelProject.previewReview(sessionId, workspaceId, review),
          reviewResultPacket: async (workspaceId, review) =>
            await uiCtx.remote.novelProject.review(sessionId, workspaceId, review),
          retrieve: async (workspaceId, query) =>
            await uiCtx.remote.novelProject.retrieve(workspaceId, query),
          readRevision: async (workspaceId, revision) =>
            await uiCtx.remote.novelProject.read(workspaceId, revision),
          projectCanon: async (workspaceId, revision) =>
            await uiCtx.remote.novelProject.projectCanon(workspaceId, revision),
          projectNarrative: async (workspaceId, revision) =>
            await uiCtx.remote.novelProject.projectNarrative(workspaceId, revision),
          projectManuscripts: async (workspaceId, revision) =>
            await uiCtx.remote.novelProject.projectManuscripts(workspaceId, revision),
          projectRelationships: async (workspaceId, revision) =>
            await uiCtx.remote.novelProject.projectRelationships(workspaceId, revision),
          rollbackRevision: async (workspaceId, command) =>
            await uiCtx.remote.novelProject.rollback(sessionId, workspaceId, command),
          pendingProposals: async workspaceId =>
            await uiCtx.remote.novelProject.pendingProposals(workspaceId),
          discardProposal: async (workspaceId, packetId) =>
            await uiCtx.remote.novelProject.discardProposal(workspaceId, packetId),
        }),
      }, NovelProjectPanel))
    },
  })
  await uiFiber.await()

  return async () => {
    await uiFiber.dispose()
    await disposeRemote()
  }
}
