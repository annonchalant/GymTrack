// Bezier line chart — visual replica of react-native-chart-kit's LineChart as
// configured on the mobile Progress screen: dashed horizontal grid lines,
// electric-blue bezier line with a soft gradient fill, dots stroked with the
// page background, muted axis labels.

import { colors } from "@/theme/colors";

type Props = {
  labels: string[];
  values: number[];
  height?: number;
};

const W = 400;
const PAD_LEFT = 44;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const SEGMENTS = 4;

// Smooth cubic bezier through points (control points at half the x-distance),
// matching chart-kit's `bezier` interpolation closely.
function bezierPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = (p1.x - p0.x) / 2;
    d += ` C${p0.x + cx},${p0.y} ${p1.x - cx},${p1.y} ${p1.x},${p1.y}`;
  }
  return d;
}

export default function LineChart({ labels, values, height = 220 }: Props) {
  const H = height;
  const innerW = W - PAD_LEFT - PAD_RIGHT;
  const innerH = H - PAD_TOP - PAD_BOTTOM;

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Avoid a flat/zero range; pad like chart-kit does when min === max.
  const min = rawMin === rawMax ? rawMin - 1 : rawMin;
  const max = rawMin === rawMax ? rawMax + 1 : rawMax;

  const xFor = (i: number) =>
    values.length === 1
      ? PAD_LEFT + innerW / 2
      : PAD_LEFT + (innerW * i) / (values.length - 1);
  const yFor = (v: number) => PAD_TOP + innerH * (1 - (v - min) / (max - min));

  const pts = values.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const linePath = bezierPath(pts);
  const areaPath =
    linePath +
    ` L${pts[pts.length - 1].x},${PAD_TOP + innerH} L${pts[0].x},${PAD_TOP + innerH} Z`;

  const gridYs = Array.from({ length: SEGMENTS + 1 }, (_, s) => {
    const v = min + ((max - min) * s) / SEGMENTS;
    return { y: yFor(v), value: v };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block", borderRadius: 12, background: colors.surface }}
    >
      <defs>
        <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.accent} stopOpacity={0.25} />
          <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Dashed horizontal grid lines */}
      {gridYs.map(({ y }, i) => (
        <line
          key={i}
          x1={PAD_LEFT}
          x2={W - PAD_RIGHT}
          y1={y}
          y2={y}
          stroke={colors.border}
          strokeDasharray="4 6"
        />
      ))}

      {/* Y-axis labels */}
      {gridYs.map(({ y, value }, i) => (
        <text
          key={i}
          x={PAD_LEFT - 8}
          y={y + 4}
          textAnchor="end"
          fontSize={12}
          fill={colors.textSecondary}
        >
          {Math.round(value)}
        </text>
      ))}

      {/* X-axis labels */}
      {labels.map((label, i) => (
        <text
          key={i}
          x={xFor(i)}
          y={H - 8}
          textAnchor="middle"
          fontSize={11}
          fill={colors.textSecondary}
        >
          {label}
        </text>
      ))}

      {/* Gradient fill under the line */}
      <path d={areaPath} fill="url(#line-fill)" />

      {/* Bezier line */}
      <path d={linePath} fill="none" stroke={colors.accent} strokeWidth={3} />

      {/* Dots */}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={5}
          fill={colors.accent}
          stroke={colors.background}
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}
