import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BLOCK_LIBRARY,
  buildContext,
  createBlock,
  createBlueprintFromTemplate,
  nextPendingIndex,
  reorderBlocks,
  resumeExecution,
  WORKFLOW_TEMPLATES,
  type WorkflowExecution,
} from '../src/services/workflowBuilder';

describe('Workflow builder — real orchestration model', () => {
  it('offers only executable block kinds', () => {
    const kinds = Object.keys(BLOCK_LIBRARY);
    assert.deepEqual(kinds.sort(), ['agents', 'ai', 'candles', 'chart', 'market', 'news', 'risk']);
    for (const kind of kinds) {
      assert.ok(BLOCK_LIBRARY[kind as keyof typeof BLOCK_LIBRARY].title.length > 0);
    }
  });

  it('builds templates with real ordered blocks and unique ids', () => {
    assert.ok(WORKFLOW_TEMPLATES.length >= 5);
    for (const template of WORKFLOW_TEMPLATES) {
      const blueprint = createBlueprintFromTemplate('usr_test', template.id);
      assert.equal(blueprint.blocks.length, template.blocks.length);
      assert.equal(new Set(blueprint.blocks.map((b) => b.id)).size, blueprint.blocks.length);
      assert.ok(blueprint.blocks.every((b) => BLOCK_LIBRARY[b.kind]));
    }
  });

  it('reorders blocks without losing or mutating them', () => {
    const blocks = [createBlock('market'), createBlock('news'), createBlock('ai')];
    const original = blocks.map((b) => b.id);
    const moved = reorderBlocks(blocks, 2, 0);
    assert.deepEqual(moved.map((b) => b.id), [original[2], original[0], original[1]]);
    assert.deepEqual(blocks.map((b) => b.id), original, 'input array is not mutated');
    assert.deepEqual(reorderBlocks(blocks, 0, 0).map((b) => b.id), original);
    assert.deepEqual(reorderBlocks(blocks, -1, 2).map((b) => b.id), original);
    assert.deepEqual(reorderBlocks(blocks, 0, 9).map((b) => b.id), original);
  });

  it('resumes from the first block that did not succeed', () => {
    assert.equal(nextPendingIndex([
      { blockId: 'a', kind: 'market', title: 'A', status: 'success' },
      { blockId: 'b', kind: 'news', title: 'B', status: 'error' },
      { blockId: 'c', kind: 'ai', title: 'C', status: 'idle' },
    ]), 1);
    assert.equal(nextPendingIndex([
      { blockId: 'a', kind: 'market', title: 'A', status: 'success' },
      { blockId: 'b', kind: 'news', title: 'B', status: 'success' },
    ]), -1);
  });

  it('passes only real successful outputs to the next AI block', () => {
    const context = buildContext([
      { blockId: 'a', kind: 'market', title: 'Marché', status: 'success', output: { lastClose: 101.5 } },
      { blockId: 'b', kind: 'news', title: 'News', status: 'error', error: 'source down' },
      { blockId: 'c', kind: 'ai', title: 'IA', status: 'success', summary: 'Synthèse' },
    ]);
    assert.match(context, /Marché/);
    assert.match(context, /101\.5/);
    assert.doesNotMatch(context, /source down/);
    assert.match(context, /Synthèse/);
  });

  it('bounds the context handed to a paid AI call', () => {
    const context = buildContext([
      { blockId: 'a', kind: 'market', title: 'Marché', status: 'success', output: { blob: 'x'.repeat(50000) } },
    ], 1200);
    assert.ok(context.length <= 1200);
  });

  it('refuses to resume an execution whose blueprint changed', async () => {
    const blueprint = createBlueprintFromTemplate('usr_test', 'market-intelligence');
    const execution: WorkflowExecution = {
      id: 'run_test',
      blueprintId: blueprint.id,
      userId: 'usr_test',
      name: blueprint.name,
      symbol: 'BTC/USDT',
      timeframe: '1H',
      status: 'error',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      blocks: blueprint.blocks.map((block) => ({
        blockId: block.id,
        kind: block.kind,
        title: block.title,
        status: 'success',
      })),
    };
    const reordered = { ...blueprint, blocks: reorderBlocks(blueprint.blocks, 0, 1) };
    await assert.rejects(() => resumeExecution(reordered, execution), /définition du workflow a changé/);
  });
});
