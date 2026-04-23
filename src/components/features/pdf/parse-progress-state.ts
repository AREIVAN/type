import type { ParseProgress } from '@/services/pdf-parser';

export type PageProcessingStatus = 'pending' | 'processing' | 'done' | 'error';

export interface PageProgressTile {
  order: number;
  sourcePageNumber: number;
  status: PageProcessingStatus;
}

export type VisiblePageProgressItem =
  | { type: 'tile'; tile: PageProgressTile }
  | { type: 'gap'; id: string };

interface BuildPageProgressTilesOptions {
  isProcessing: boolean;
  errorOrder?: number | null;
  orderToSourcePage?: ReadonlyMap<number, number>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildPageProgressTiles(
  progress: ParseProgress | null,
  options: BuildPageProgressTilesOptions
): PageProgressTile[] {
  if (!progress || progress.total < 1) {
    return [];
  }

  const currentOrder = clamp(progress.current, 1, progress.total);

  return Array.from({ length: progress.total }, (_, index) => {
    const order = index + 1;
    const sourcePageNumber =
      options.orderToSourcePage?.get(order) ?? (order === currentOrder ? progress.pageNumber : order);

    let status: PageProcessingStatus = 'pending';
    if (order < currentOrder) {
      status = 'done';
    } else if (order === currentOrder) {
      status = options.isProcessing ? 'processing' : 'done';
    }

    if (options.errorOrder === order) {
      status = 'error';
    }

    return {
      order,
      sourcePageNumber,
      status,
    };
  });
}

export function buildVisiblePageProgressItems(
  tiles: PageProgressTile[],
  currentOrder: number,
  maxVisible = 60
): VisiblePageProgressItem[] {
  if (tiles.length <= maxVisible) {
    return tiles.map((tile) => ({ type: 'tile' as const, tile }));
  }

  const safeCurrent = clamp(currentOrder, 1, tiles.length);
  const selected = new Set<number>();

  for (let index = 1; index <= 4; index += 1) selected.add(index);
  for (let index = safeCurrent - 6; index <= safeCurrent + 6; index += 1) selected.add(index);
  for (let index = tiles.length - 3; index <= tiles.length; index += 1) selected.add(index);

  const indexes = [...selected]
    .filter((index) => index >= 1 && index <= tiles.length)
    .sort((left, right) => left - right);

  const items: VisiblePageProgressItem[] = [];
  let previous = 0;

  indexes.forEach((index) => {
    if (previous !== 0 && index - previous > 1) {
      items.push({ type: 'gap', id: `${previous}-${index}` });
    }

    items.push({ type: 'tile', tile: tiles[index - 1] });
    previous = index;
  });

  return items;
}
