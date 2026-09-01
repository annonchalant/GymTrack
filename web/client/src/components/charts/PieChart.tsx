// Pie chart — visual replica of react-native-chart-kit's PieChart as used on
// the mobile Progress screen (legend disabled there; the page renders its own).

type Slice = {
  name: string;
  population: number;
  color: string;
};

type Props = {
  data: Slice[];
  size?: number;
};

function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export default function PieChart({ data, size = 200 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const total = data.reduce((a, s) => a + s.population, 0);

  // Single slice → full circle (an arc path can't render 360°).
  if (data.length === 1) {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        style={{ display: "block", margin: "0 auto" }}
      >
        <circle cx={cx} cy={cy} r={r} fill={data[0].color} />
      </svg>
    );
  }

  let angle = -Math.PI / 2; // start at 12 o'clock
  const paths = data.map((slice) => {
    const sweep = (slice.population / total) * Math.PI * 2;
    const start = polar(cx, cy, r, angle);
    const end = polar(cx, cy, r, angle + sweep);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const d = `M${cx},${cy} L${start.x},${start.y} A${r},${r} 0 ${largeArc} 1 ${end.x},${end.y} Z`;
    angle += sweep;
    return { d, color: slice.color, name: slice.name };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      style={{ display: "block", margin: "0 auto" }}
    >
      {paths.map((p) => (
        <path key={p.name} d={p.d} fill={p.color} />
      ))}
    </svg>
  );
}
