export const clampToRange = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const generateGridTemplate = (sizes: number[] | null, count: number, gapSize: number) => {
  if (sizes) {
    return sizes
      .map((size, index) => (index < sizes.length - 1 ? `${size}px ${gapSize}px` : `${size}px`))
      .join(' ');
  }

  return Array(count)
    .fill('1fr')
    .join(` ${gapSize}px `);
};

export const computeEqualTracks = (available: number, count: number, min: number) => {
  const safeAvailable = Math.max(0, Math.floor(available));
  const base = Math.floor(safeAvailable / count);
  const remainder = safeAvailable - base * count;

  return Array.from({ length: count }, (_, index) => Math.max(min, base + (index < remainder ? 1 : 0)));
};
