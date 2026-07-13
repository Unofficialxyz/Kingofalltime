interface Props { points: number[]; positive?: boolean; height?: number; width?: number; }
export function Sparkline({ points, positive = true, height = 36, width = 120 }: Props) {
  if (!points.length || points.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(height - ((p - min) / range) * (height - 4) - 2).toFixed(1)}`).join(" ");
  const color = positive ? "#10b981" : "#ef4444";
  const fill = positive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)";
  const areaPath = path + ` L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={areaPath} fill={fill} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
