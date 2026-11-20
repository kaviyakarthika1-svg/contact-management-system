/** Slim progress bar used for "profile completeness". */
export default function ProgressBar({ value = 0, tone }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`progress__bar ${tone ? `progress__bar--${tone}` : ''}`.trim()}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
