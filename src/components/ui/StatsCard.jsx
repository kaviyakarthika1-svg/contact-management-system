import Icon from './Icon';

/** Dashboard statistic tile (icon + value + label), optionally clickable. */
export default function StatsCard({ icon, label, value, tone = 'primary', hint, onClick }) {
  const content = (
    <>
      <span className={`stats-card__icon stats-card__icon--${tone}`}>
        <Icon name={icon} size={20} />
      </span>
      <div className="stats-card__text">
        <span className="stats-card__value">{value}</span>
        <span className="stats-card__label">{label}</span>
        {hint ? <span className="stats-card__hint">{hint}</span> : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="stats-card stats-card--button" onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className="stats-card">{content}</div>;
}
