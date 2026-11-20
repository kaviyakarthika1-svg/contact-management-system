/** Skeleton placeholder lines shown while a page "loads". */
export default function Skeleton({ rows = 3, className = '' }) {
  return (
    <div className={`skeleton ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton__row">
          <span className="skeleton__avatar skeleton__shine" />
          <span className="skeleton__lines">
            <span className="skeleton__line skeleton__shine" style={{ width: '55%' }} />
            <span className="skeleton__line skeleton__shine" style={{ width: '80%' }} />
          </span>
        </div>
      ))}
    </div>
  );
}
