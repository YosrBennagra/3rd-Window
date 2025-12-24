/**
 * Unit Tests: Grid Calculators
 * 
 * Tests pure grid calculation functions in domain/calculators/grid.ts
 */

import { describe, it, expect } from 'vitest';
import {
  clampValue,
  boxesOverlap,
  findFirstAvailablePosition,
  calculateCellSize,
  snapToGrid,
  fitsInGrid,
} from '@domain/calculators/grid';

describe('clampValue', () => {
  it('clamps value to range', () => {
    expect(clampValue(5, 0, 10)).toBe(5);
    expect(clampValue(-5, 0, 10)).toBe(0);
    expect(clampValue(15, 0, 10)).toBe(10);
  });

  it('handles edge cases', () => {
    expect(clampValue(0, 0, 10)).toBe(0);
    expect(clampValue(10, 0, 10)).toBe(10);
    expect(clampValue(5, 5, 5)).toBe(5);
  });
});

describe('boxesOverlap', () => {
  it('detects overlapping boxes', () => {
    const box1 = { x: 0, y: 0, width: 2, height: 2 };
    const box2 = { x: 1, y: 1, width: 2, height: 2 };
    expect(boxesOverlap(box1, box2)).toBe(true);
  });

  it('detects non-overlapping boxes', () => {
    const box1 = { x: 0, y: 0, width: 2, height: 2 };
    const box2 = { x: 3, y: 0, width: 2, height: 2 };
    expect(boxesOverlap(box1, box2)).toBe(false);
  });

  it('detects adjacent boxes (no overlap)', () => {
    const box1 = { x: 0, y: 0, width: 2, height: 2 };
    const box2 = { x: 2, y: 0, width: 2, height: 2 };
    expect(boxesOverlap(box1, box2)).toBe(false);
  });

  it('detects complete containment', () => {
    const box1 = { x: 0, y: 0, width: 4, height: 4 };
    const box2 = { x: 1, y: 1, width: 2, height: 2 };
    expect(boxesOverlap(box1, box2)).toBe(true);
  });
});

describe('findFirstAvailablePosition', () => {
  const gridCols = 6;
  const gridRows = 6;

  it('finds position in empty grid', () => {
    const widgets: never[] = [];
    const result = findFirstAvailablePosition(widgets, 2, 2, gridCols, gridRows);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('finds position after occupied space', () => {
    const widgets = [{ x: 0, y: 0, width: 2, height: 2 }];
    const result = findFirstAvailablePosition(widgets, 2, 2, gridCols, gridRows);
    expect(result).toEqual({ x: 2, y: 0 });
  });

  it('returns null when no space available', () => {
    const widgets = [{ x: 0, y: 0, width: gridCols, height: gridRows }];
    const result = findFirstAvailablePosition(widgets, 1, 1, gridCols, gridRows);
    expect(result).toBeNull();
  });

  it('finds position in complex layout', () => {
    const widgets = [
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 2, y: 0, width: 2, height: 2 },
      { x: 4, y: 0, width: 2, height: 2 },
    ];
    const result = findFirstAvailablePosition(widgets, 2, 2, gridCols, gridRows);
    expect(result).toEqual({ x: 0, y: 2 });
  });
});

describe('calculateCellSize', () => {
  it('calculates equal cell sizes', () => {
    const result = calculateCellSize(1000, 600, 10, 6, 8);
    expect(result.cellWidth).toBeCloseTo(92.8);
    expect(result.cellHeight).toBeCloseTo(93.333);
  });

  it('handles no gap', () => {
    const result = calculateCellSize(1000, 600, 10, 6, 0);
    expect(result.cellWidth).toBe(100);
    expect(result.cellHeight).toBe(100);
  });

  it('handles different dimensions', () => {
    const result = calculateCellSize(1920, 1080, 24, 12, 8);
    // 1920 - (8 * 23 gaps) = 1920 - 184 = 1736 / 24 = 72.333
    // 1080 - (8 * 11 gaps) = 1080 - 88 = 992 / 12 = 82.667
    expect(result.cellWidth).toBeCloseTo(72.333, 1);
    expect(result.cellHeight).toBeCloseTo(82.667, 1);
  });
});

describe('snapToGrid', () => {
  it('snaps to nearest grid cell', () => {
    expect(snapToGrid(0, 100, 8)).toBe(0);
    expect(snapToGrid(54, 100, 8)).toBe(1); // 54 / 108 ≈ 0.5
    expect(snapToGrid(216, 100, 8)).toBe(2);
  });

  it('handles different cell sizes', () => {
    expect(snapToGrid(150, 50, 8)).toBe(3); // 150 / 58 ≈ 2.6
    expect(snapToGrid(200, 50, 8)).toBe(3); // 200 / 58 ≈ 3.4
  });
});

describe('fitsInGrid', () => {
  const gridCols = 6;
  const gridRows = 6;

  it('detects widgets that fit', () => {
    expect(fitsInGrid(0, 0, 2, 2, gridCols, gridRows)).toBe(true);
    expect(fitsInGrid(4, 4, 2, 2, gridCols, gridRows)).toBe(true);
  });

  it('detects widgets that overflow horizontally', () => {
    expect(fitsInGrid(5, 0, 2, 2, gridCols, gridRows)).toBe(false);
  });

  it('detects widgets that overflow vertically', () => {
    expect(fitsInGrid(0, 5, 2, 2, gridCols, gridRows)).toBe(false);
  });

  it('detects negative positions', () => {
    expect(fitsInGrid(-1, 0, 2, 2, gridCols, gridRows)).toBe(false);
    expect(fitsInGrid(0, -1, 2, 2, gridCols, gridRows)).toBe(false);
  });
});
