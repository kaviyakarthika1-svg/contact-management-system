import Icon from './Icon';

/** Card used to frame a page section (dashboard panels, detail panels). */
export default function SectionCard({ title, subtitle, icon, action, children, className = '', bodyClass = '' }) {
  return (
    <section className={`section-card ${className}`.trim()}>
      {title || action ? (
        <header className="section-card__header">
          <div className="section-card__heading">
            {icon ? (
              <span className="section-card__icon">
                <Icon name={icon} size={16} />
              </span>
            ) : null}
            <div>
              <h2 className="section-card__title">{title}</h2>
              {subtitle ? <p className="section-card__subtitle">{subtitle}</p> : null}
            </div>
          </div>
          {action ? <div className="section-card__action">{action}</div> : null}
        </header>
      ) : null}
      <div className={`section-card__body ${bodyClass}`.trim()}>{children}</div>
    </section>
  );
}
