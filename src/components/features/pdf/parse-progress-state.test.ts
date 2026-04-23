import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPageProgressTiles, buildVisiblePageProgressItems } from './parse-progress-state';

test('maps page states using live parser progress', () => {
  const tiles = buildPageProgressTiles(
    { current: 3, total: 5, pageNumber: 8 },
    {
      isProcessing: true,
      orderToSourcePage: new Map([
        [1, 1],
        [2, 4],
        [3, 8],
      ]),
    }
  );

  assert.deepEqual(
    tiles.map((tile) => ({ order: tile.order, sourcePageNumber: tile.sourcePageNumber, status: tile.status })),
    [
      { order: 1, sourcePageNumber: 1, status: 'done' },
      { order: 2, sourcePageNumber: 4, status: 'done' },
      { order: 3, sourcePageNumber: 8, status: 'processing' },
      { order: 4, sourcePageNumber: 4, status: 'pending' },
      { order: 5, sourcePageNumber: 5, status: 'pending' },
    ]
  );
});

test('marks current tile as error when parsing fails', () => {
  const tiles = buildPageProgressTiles(
    { current: 2, total: 4, pageNumber: 2 },
    {
      isProcessing: false,
      errorOrder: 2,
      orderToSourcePage: new Map([
        [1, 1],
        [2, 2],
      ]),
    }
  );

  assert.deepEqual(tiles.map((tile) => tile.status), ['done', 'error', 'pending', 'pending']);
});

test('collapses large progress sets into visible windows with gaps', () => {
  const tiles = buildPageProgressTiles(
    { current: 46, total: 120, pageNumber: 46 },
    {
      isProcessing: true,
    }
  );

  const visible = buildVisiblePageProgressItems(tiles, 46, 24);

  const tileOrders = visible.filter((item) => item.type === 'tile').map((item) => item.tile.order);
  const gapCount = visible.filter((item) => item.type === 'gap').length;

  assert.ok(tileOrders.includes(1));
  assert.ok(tileOrders.includes(46));
  assert.ok(tileOrders.includes(120));
  assert.ok(gapCount >= 2);
  assert.ok(visible.length < tiles.length);
});
