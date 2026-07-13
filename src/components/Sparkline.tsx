interface Props {
  points: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

export function Sparkline({ points, width = 120, height = 36, positive }: Props) {
  if (!points.length) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const x = (i: number) => (i / (points.length - 1 || 1)) * width;
  const y = (p: number) => height - ((p - min) / range) * height;
  const d = points.map((p, i) => `${x(i)},${y(p)}`).join(' ');
  const up = positive ?? points[points.length - 1] >= points[0];
  const color = up ? '#16c784' : '#ea3943';
  const areaD = `M0,${height} L${d.replace(/ /g, ' L')} L${width},${height} Z`;
  const gradId = `spark-${up ? 'g' : 'r'}-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaD} fill={`url(#${gradId})`} />
      <polyline points={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
