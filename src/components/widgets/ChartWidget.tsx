const sparklinePoints = [8, 10, 9, 13, 14, 12, 16, 18, 17, 20];

export function ChartWidget() {
  const max = Math.max(...sparklinePoints);
  const min = Math.min(...sparklinePoints);
  const range = Math.max(1, max - min);

  const points = sparklinePoints
    .map((value, index) => {
      const x = (index / (sparklinePoints.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const latest = sparklinePoints[sparklinePoints.length - 1];

  return (
    <div className="widget widget--medium chart-widget">
      <div className="widget__header">
        <span className="widget__icon">📈</span>
        <div>
          <div className="widget__title">Engagement</div>
          <div className="widget__subtitle">Chart widget snaps to grid cells</div>
        </div>
      </div>

      <div className="chart-widget__body">
        <div className="chart-widget__value">{latest}%</div>
        <div className="chart-widget__sparkline" role="img" aria-label="Engagement trend sparkline">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline fill="none" stroke="url(#chartGradient)" strokeWidth="3" points={points} />
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}
