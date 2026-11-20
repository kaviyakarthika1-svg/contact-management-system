/** Simple accessible tab strip. */
export default function Tabs({ tabs = [], active, onChange, ariaLabel = 'Sections' }) {
  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`tabs__tab ${active === tab.id ? 'tabs__tab--active' : ''}`.trim()}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {typeof tab.count === 'number' ? <span className="tabs__count">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
