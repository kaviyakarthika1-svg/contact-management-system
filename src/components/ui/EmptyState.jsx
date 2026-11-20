import Icon from './Icon';

/**
 * Friendly empty state with an icon, message and optional actions.
 * Used whenever a list has nothing to show ("smart" empty states).
 */
export default function EmptyState({ icon = 'inbox', title, message, children }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={30} />
      </span>
      <h3 className="empty-state__title">{title}</h3>
      {message ? <p className="empty-state__message">{message}</p> : null}
      {children ? <div className="empty-state__actions">{children}</div> : null}
    </div>
  );
}
