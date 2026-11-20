import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import { fullName } from '../../utils/contactUtils';
import { formatTime, relativeDayLabel } from '../../utils/dateUtils';
import { isOverdue } from '../../utils/reminderUtils';

const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

/** One reminder row: priority stripe, contact chip, date/time and actions. */
export default function ReminderCard({ reminder, contact, onComplete, onEdit, onDelete }) {
  const overdue = isOverdue(reminder);

  return (
    <article
      className={`reminder-card reminder-card--${reminder.priority} ${overdue ? 'reminder-card--overdue' : ''} ${reminder.completed ? 'reminder-card--done' : ''}`.trim()}
    >
      <button
        type="button"
        className="reminder-card__check"
        aria-label={reminder.completed ? 'Mark as not done' : 'Mark as done'}
        onClick={() => onComplete(reminder)}
      >
        <Icon name={reminder.completed ? 'check' : 'check-circle'} size={17} />
      </button>

      <div className="reminder-card__body">
        <p className={`reminder-card__title ${reminder.completed ? 'is-done' : ''}`.trim()}>
          {reminder.title}
        </p>
        <div className="reminder-card__meta">
          {contact ? (
            <Link to={`/contacts/${contact.id}`} className="reminder-card__contact">
              <Avatar contact={contact} size={18} />
              {fullName(contact)}
            </Link>
          ) : (
            <span className="reminder-card__contact reminder-card__contact--missing">Contact deleted</span>
          )}
          <span className={`reminder-card__date ${overdue ? 'is-overdue' : ''}`.trim()}>
            <Icon name={overdue ? 'alert' : 'calendar'} size={13} />
            {relativeDayLabel(reminder.date)} {reminder.time ? `· ${formatTime(`${reminder.date}T${reminder.time}`)}` : ''}
            {overdue ? ' · Overdue' : ''}
          </span>
          <span className={`reminder-card__priority reminder-card__priority--${reminder.priority}`}>
            {PRIORITY_LABEL[reminder.priority] || 'Medium'} priority
          </span>
        </div>
        {reminder.notes ? <p className="reminder-card__notes">{reminder.notes}</p> : null}
      </div>

      <div className="reminder-card__actions">
        <button type="button" className="icon-btn" aria-label="Edit reminder" onClick={() => onEdit(reminder)}>
          <Icon name="edit" size={15} />
        </button>
        <button type="button" className="icon-btn icon-btn--danger" aria-label="Delete reminder" onClick={() => onDelete(reminder)}>
          <Icon name="trash" size={15} />
        </button>
      </div>
    </article>
  );
}
