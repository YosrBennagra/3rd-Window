/**
 * Domain Logic: Grid Layout Calculations
 * 
 * Pure calculation functions for grid layout.
 * Extracted from gridStore for testability.
 */

/**
 * Clamp a value between min and max
 * @pure
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Check if two grid boxes overlap
 * @pure
 */
export function boxesOverlap(
  box1: { x: number; y: number; width: number; height: number },
  box2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    box1.x + box1.width <= box2.x ||
    box2.x + box2.width <= box1.x ||
    box1.y + box1.height <= box2.y ||
    box2.y + box2.height <= box1.y
  );
}

/**
 * Find first available position in grid
 * @pure
 */
export function findFirstAvailablePosition(
  widgets: Array<{ x: number; y: number; width: number; height: number }>,
  newWidth: number,
  newHeight: number,
  gridCols: number,
  gridRows: number
): { x: number; y: number } | null {
  for (let y = 0; y <= gridRows - newHeight; y++) {
    for (let x = 0; x <= gridCols - newWidth; x++) {
      const testBox = { x, y, width: newWidth, height: newHeight };
      if (!widgets.some((w) => boxesOverlap(w, testBox))) {
        return { x, y };
      }
    }
  }
  return null;
}

/**
 * Calculate grid cell size from container dimensions
 * @pure
 */
export function calculateCellSize(
  containerWidth: number,
  containerHeight: number,
  gridCols: number,
  gridRows: number,
  gap: number = 8
): { cellWidth: number; cellHeight: number } {
  const totalGapX = gap * (gridCols - 1);
  const totalGapY = gap * (gridRows - 1);
  
  const cellWidth = (containerWidth - totalGapX) / gridCols;
  const cellHeight = (containerHeight - totalGapY) / gridRows;
  
  return { cellWidth, cellHeight };
}

/**
 * Snap position to grid
 * @pure
 */
export function snapToGrid(value: number, cellSize: number, gap: number): number {
  return Math.round(value / (cellSize + gap));
}

/**
 * Check if widget fits in grid
 * @pure
 */
export function fitsInGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  gridCols: number,
  gridRows: number
): boolean {
  return x >= 0 && y >= 0 && x + width <= gridCols && y + height <= gridRows;
}
