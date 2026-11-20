import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { ACTIVITY_META, ACTIVITY_FILTERS } from '../../utils/constants';
import { relativeDayLabel, formatTime } from '../../utils/dateUtils';
import { useState } from 'react';

/**
 * Vertical timeline of activity entries, grouped by day.
 * Optionally shows the filter chips (Activity page) or plain list (details page).
 */
export default function ActivityTimeline({ activities, showFilters = false, emptyMessage = 'No activity yet.' }) {
  const [filter, setFilter] = useState('all');

  const visible = showFilters && filter !== 'all'
    ? activities.filter((a) => {
        const filterDef = ACTIVITY_FILTERS.find((f) => f.id === filter);
        return filterDef?.types?.includes(a.type);
      })
    : activities;

  const groups = [];
  visible.forEach((activity) => {
    const day = relativeDayLabel(activity.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(activity);
    else groups.push({ day, items: [activity] });
  });

  if (visible.length === 0) {
    return <p className="timeline__empty">{emptyMessage}</p>;
  }

  return (
    <div className="timeline">
      {showFilters ? (
        <div className="timeline__filters" role="group" aria-label="Filter activity">
          {ACTIVITY_FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`chip ${filter === option.id ? 'chip--active' : ''}`.trim()}
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      {groups.map((group) => (
        <div key={group.day} className="timeline__group">
          <h4 className="timeline__day">{group.day}</h4>
          <ol className="timeline__list">
            {group.items.map((activity) => {
              const meta = ACTIVITY_META[activity.type] || { icon: 'activity', label: 'Activity', tone: 'muted' };
              return (
                <li key={activity.id} className="timeline__item">
                  <span className={`timeline__dot timeline__dot--${meta.tone}`}>
                    <Icon name={meta.icon} size={13} />
                  </span>
                  <div className="timeline__content">
                    <span className="timeline__type">{meta.label}</span>
                    <p className="timeline__message">{activity.message}</p>
                    {activity.contactId ? (
                      <Link to={`/contacts/${activity.contactId}`} className="timeline__contact">
                        {activity.contactName || 'Open contact'}
                        <Icon name="chevron-right" size={12} />
                      </Link>
                    ) : null}
                  </div>
                  <time className="timeline__time" dateTime={activity.timestamp}>
                    {formatTime(activity.timestamp)}
                  </time>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
