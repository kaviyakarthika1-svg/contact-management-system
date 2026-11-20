import Icon from '../ui/Icon';
import { SORT_OPTIONS } from '../../utils/contactUtils';

const QUICK_FILTERS = [
  { id: 'favorites', label: 'Favorites', icon: 'star' },
  { id: 'recent', label: 'Recently added', icon: 'zap' },
  { id: 'reminder', label: 'Has reminder', icon: 'bell' },
  { id: 'email', label: 'Has email', icon: 'mail' },
  { id: 'phone', label: 'Has phone', icon: 'phone' },
];

/**
 * Search + filter + sort toolbar for the Contacts page.
 * `filters` = { query, group, tag, quick:Set, sort, view }
 */
export default function ContactFilterBar({
  filters,
  onChange,
  groups = [],
  tags = [],
  resultCount,
  totalCount,
}) {
  const setFilter = (patch) => onChange({ ...filters, ...patch });

  const toggleQuick = (id) => {
    const next = new Set(filters.quick);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFilter({ quick: next });
  };

  const hasActiveFilters =
    filters.query.trim() !== '' ||
    filters.group !== 'all' ||
    filters.tag !== 'all' ||
    filters.quick.size > 0;

  return (
    <div className="filter-bar">
      <div className="filter-bar__row">
        <div className="filter-bar__search">
          <Icon name="search" size={16} />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => setFilter({ query: event.target.value })}
            placeholder="Search by name, phone, email, company or group…"
            aria-label="Search contacts"
          />
          {filters.query ? (
            <button type="button" className="icon-btn" aria-label="Clear search" onClick={() => setFilter({ query: '' })}>
              <Icon name="x" size={14} />
            </button>
          ) : null}
        </div>

        <select
          className="input select"
          value={filters.group}
          onChange={(event) => setFilter({ group: event.target.value })}
          aria-label="Filter by group"
        >
          <option value="all">All groups</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        <select
          className="input select"
          value={filters.tag}
          onChange={(event) => setFilter({ tag: event.target.value })}
          aria-label="Filter by tag"
        >
          <option value="all">All tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>

        <select
          className="input select"
          value={filters.sort}
          onChange={(event) => setFilter({ sort: event.target.value })}
          aria-label="Sort contacts"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="filter-bar__views" role="group" aria-label="Layout">
          <button
            type="button"
            className={`icon-btn ${filters.view === 'grid' ? 'icon-btn--active' : ''}`.trim()}
            aria-label="Grid view"
            aria-pressed={filters.view === 'grid'}
            onClick={() => setFilter({ view: 'grid' })}
          >
            <Icon name="grid" size={16} />
          </button>
          <button
            type="button"
            className={`icon-btn ${filters.view === 'list' ? 'icon-btn--active' : ''}`.trim()}
            aria-label="List view"
            aria-pressed={filters.view === 'list'}
            onClick={() => setFilter({ view: 'list' })}
          >
            <Icon name="list" size={16} />
          </button>
        </div>
      </div>

      <div className="filter-bar__row filter-bar__row--secondary">
        <div className="filter-chips" role="group" aria-label="Quick filters">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`chip ${filters.quick.has(filter.id) ? 'chip--active' : ''}`.trim()}
              aria-pressed={filters.quick.has(filter.id)}
              onClick={() => toggleQuick(filter.id)}
            >
              <Icon name={filter.icon} size={13} />
              {filter.label}
            </button>
          ))}
        </div>
        <div className="filter-bar__meta">
          <span aria-live="polite">
            Showing <strong>{resultCount}</strong> of {totalCount} contacts
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                onChange({ ...filters, query: '', group: 'all', tag: 'all', quick: new Set() })
              }
            >
              <Icon name="x" size={13} /> Reset
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
