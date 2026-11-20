/** Pure-CSS bar chart (no chart library) used on the dashboard. */
export default function MiniBarChart({ data = [], height = 140 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((item) => (
        <div key={item.label} className="bar-chart__col" title={`${item.label}: ${item.value}`}>
          <div className="bar-chart__track">
            <div
              className="bar-chart__bar"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="bar-chart__label">{item.label}</span>
          <span className="bar-chart__value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
